const SUPABASE_URL =
"https://nnwfhnrpkdoqianaaemn.supabase.co";

const SUPABASE_KEY =
"sb_publishable_sKRS_umIWmrTQUSvftyYEA_Y7Sr6kvH";

const client =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function trackReport() {

    const code =
    document
    .getElementById(
        "trackingCode"
    )
    .value
    .trim();

    if(!code){

        alert(
            "Enter Tracking Code"
        );

        return;
    }

    const {
        data,
        error
    } =
    await client
    .from("reports")
    .select("*")
    .eq(
        "tracking_code",
        code
    )
    .single();

    if(error || !data){

        document
        .getElementById(
            "result"
        )
        .innerHTML =
        `
        <div class="result-card">
            Report not found.
        </div>
        `;

        return;
    }

    document
    .getElementById(
        "result"
    )
    .innerHTML =
    `
    <div class="result-card">

        <h3>
            ${data.incident_type}
        </h3>

        <br>

        <p>
            <strong>Description:</strong>
            ${data.description}
        </p>

        <br>

        <p>
            <strong>Location:</strong>
            ${data.location_name}
        </p>

        <br>

        <p>
            <strong>Status:</strong>

            <span class="
                status
                ${data.status.toLowerCase()}
            ">
                ${data.status}
            </span>
        </p>

        <br>

        <p>
            <strong>Tracking Code:</strong>
            ${data.tracking_code}
        </p>

        <br>

        <p>
            <strong>Date:</strong>
            ${new Date(
                data.created_at
            ).toLocaleString()}
        </p>

    </div>
    `;
}