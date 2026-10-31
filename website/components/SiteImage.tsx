import * as ReactDOM from "react-dom";
import { siteImageAttributes, siteImagePreloadOptions, type SiteImageInput } from "../lib/site-image";

/** Static same-origin public images used by the six migrated website surfaces. */
export default function SiteImage(props: SiteImageInput) {
  const attributes = siteImageAttributes(props);
  if (props.priority && typeof ReactDOM.preload === "function") {
    ReactDOM.preload(attributes.src, siteImagePreloadOptions(props));
  }
  return <img {...attributes} />;
}
