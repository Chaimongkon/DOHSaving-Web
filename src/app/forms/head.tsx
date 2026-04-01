import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_SHORT_NAME,
  absoluteUrl,
} from "@/lib/seo";

const title = `Forms | ${SITE_SHORT_NAME}`;
const description =
  "Download membership, deposit, loan, welfare, complaint, and other forms from the Department of Highways Saving Cooperative.";
const canonical = absoluteUrl("/forms");
const image = absoluteUrl(DEFAULT_OG_IMAGE);

export default function Head() {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="DOHSaving forms, cooperative forms, loan forms, deposit forms, member forms" />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
