// ==========================
// SUPABASE CONFIG
// ==========================

const SUPABASE_URL =
  "https://nnwfhnrpkdoqianaaemn.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_sKRS_umIWmrTQUSvftyYEA_Y7Sr6kvH";

const client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ==========================
// DOM ELEMENTS
// ==========================

const form = document.getElementById("reportForm");
const photoInput = document.getElementById("photo");
const preview = document.getElementById("preview");
const submitBtn = document.querySelector("button[type='submit']");

// ==========================
// IMAGE PREVIEW
// ==========================

photoInput.addEventListener("change", () => {

  const file = photoInput.files[0];

  if (!file) {
    preview.style.display = "none";
    preview.src = "";
    return;
  }

  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";

});

// ==========================
// GENERATE TRACKING CODE
// ==========================

function generateTrackingCode() {

  const random =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  return `CSR-${Date.now()}-${random}`;
}

// ==========================
// GET HIGH ACCURACY GPS
// ==========================

function getLocation() {

  return new Promise((resolve, reject) => {

    if (!navigator.geolocation) {

      reject(
        new Error(
          "Geolocation not supported"
        )
      );

      return;
    }

    let bestPosition = null;

    const watchId =
      navigator.geolocation.watchPosition(

        (position) => {

          if (
            !bestPosition ||
            position.coords.accuracy <
            bestPosition.coords.accuracy
          ) {

            bestPosition = position;
          }

          if (
            position.coords.accuracy <= 30
          ) {

            navigator.geolocation.clearWatch(
              watchId
            );

            resolve({
              latitude:
                position.coords.latitude,

              longitude:
                position.coords.longitude,

              accuracy:
                position.coords.accuracy
            });
          }
        },

        (error) => {

          navigator.geolocation.clearWatch(
            watchId
          );

          reject(error);
        },

        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      );

    setTimeout(() => {

      navigator.geolocation.clearWatch(
        watchId
      );

      if (bestPosition) {

        resolve({
          latitude:
            bestPosition.coords.latitude,

          longitude:
            bestPosition.coords.longitude,

          accuracy:
            bestPosition.coords.accuracy
        });

      } else {

        reject(
          new Error(
            "Unable to determine location."
          )
        );
      }

    }, 10000);

  });

}

// ==========================
// GET REAL ADDRESS
// ==========================

async function getLocationName(
  lat,
  lon
) {

  try {

    const response =
      await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${lat}&lon=${lon}`
      );

    const data =
      await response.json();

    if (!data.address) {

      return data.display_name ||
      `${lat}, ${lon}`;
    }

    const a = data.address;

    const street =
      a.road ||
      a.residential ||
      a.hamlet ||
      "";

    const area =
      a.suburb ||
      a.neighbourhood ||
      a.village ||
      a.city_district ||
      "";

    const city =
      a.city ||
      a.town ||
      a.county ||
      "";

    const state =
      a.state || "";

    const country =
      a.country || "";

    return [
      street,
      area,
      city,
      state,
      country
    ]
      .filter(Boolean)
      .join(", ");

  } catch (error) {

    console.error(
      "Location Error:",
      error
    );

    return `${lat}, ${lon}`;
  }

}

// ==========================
// IMAGE UPLOAD
// ==========================

async function uploadImage(photo) {

  if (!photo) return null;

  if (
    !photo.type.startsWith(
      "image/"
    )
  ) {

    throw new Error(
      "Only image files allowed."
    );
  }

  if (
    photo.size >
    5 * 1024 * 1024
  ) {

    throw new Error(
      "Image must be below 5MB."
    );
  }

  const extension =
    photo.name
      .split(".")
      .pop();

  const fileName =
    `report-${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const {
    error: uploadError
  } =
    await client.storage
      .from(
        "incident-images"
      )
      .upload(
        fileName,
        photo,
        {
          cacheControl:
            "3600",
          upsert: false
        }
      );

  if (uploadError) {

    console.error(
      uploadError
    );

    throw new Error(
      uploadError.message
    );
  }

  const {
    data
  } =
    client.storage
      .from(
        "incident-images"
      )
      .getPublicUrl(
        fileName
      );

  return data.publicUrl;
}

// ==========================
// SAVE REPORT
// ==========================

async function saveReport(
  report
) {

  const {
    error
  } =
    await client
      .from("reports")
      .insert([report]);

  if (error) {

    console.error(
      error
    );

    throw new Error(
      error.message
    );
  }
}

// ==========================
// SUBMIT REPORT
// ==========================

form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    submitBtn.disabled =
      true;

    submitBtn.innerHTML =
      "Submitting...";

    try {

      const incidentType =
        document
          .getElementById(
            "incidentType"
          )
          .value
          .trim();

      const description =
        document
          .getElementById(
            "description"
          )
          .value
          .trim();

      const photo =
        photoInput.files[0];

      if (
        !incidentType ||
        !description
      ) {

        throw new Error(
          "Please complete all fields."
        );
      }

      // GPS

      const location =
        await getLocation();

      // ADDRESS

      const locationName =
        await getLocationName(
          location.latitude,
          location.longitude
        );

      // TRACKING CODE

      const trackingCode =
        generateTrackingCode();

      // MAP LINK

      const mapsLink =
        `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

      // IMAGE

      const imageUrl =
        await uploadImage(
          photo
        );

      // SAVE

      await saveReport({

        tracking_code:
          trackingCode,

        incident_type:
          incidentType,

        description:
          description,

        location_name:
          locationName,

        latitude:
          location.latitude,

        longitude:
          location.longitude,

        gps_accuracy:
          Math.round(
            location.accuracy
          ),

        google_maps_link:
          mapsLink,

        image_url:
          imageUrl,

        status:
          "Pending",

        created_at:
          new Date()
            .toISOString()

      });

      // COPY TRACKING CODE

      navigator.clipboard.writeText(
        trackingCode
      );

      alert(
`✅ Report Submitted Successfully

📍 Location:
${locationName}

🎯 GPS Accuracy:
${Math.round(location.accuracy)} meters

🆔 Tracking Code:
${trackingCode}

📋 Tracking code copied to clipboard.
Use it to check your case status.`
      );

      form.reset();

      preview.src = "";

      preview.style.display =
        "none";

    } catch (error) {

      console.error(
        error
      );

      alert(
        error.message ||
        "Submission failed."
      );

    } finally {

      submitBtn.disabled =
        false;

      submitBtn.innerHTML =
        "Submit Report";
    }

  }
);