// Everything you'd want to change before launch lives here.
export const site = {
  // Formspree: create a form at formspree.io and paste its endpoint.
  // Any endpoint that accepts a POSTed `email` field and returns 2xx works.
  formEndpoint: "https://formspree.io/f/YOUR_FORM_ID",
  contactEmail: "hello@mesh.example",
};

export const formConfigured = !site.formEndpoint.includes("YOUR_FORM_ID");
