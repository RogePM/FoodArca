// Renders structured data (JSON-LD) for search engines. Server component, no client JS.
// "<" is escaped so the data can never close the script tag early.
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\u003c') }}
    />
  );
}
