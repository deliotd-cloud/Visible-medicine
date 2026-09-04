// Shared by the before-paint visibility check and the hydrated splash player.
export const SPLASH_STORAGE_KEY = "visible-medicine-splash-glide-v8";
export const SPLASH_VIDEO_SRC = "/media/splash/glide-silent-v8.mp4";

export const SPLASH_BOOTSTRAP_SCRIPT = `(function(){var root=document.documentElement;try{var key=${JSON.stringify(SPLASH_STORAGE_KEY)};root.dataset.visibleMedicineSplash=location.pathname==="/"&&!localStorage.getItem(key)?"show":"hidden";}catch(error){root.dataset.visibleMedicineSplash=location.pathname==="/"?"show":"hidden";}if(root.dataset.visibleMedicineSplash==="show")setTimeout(function(){root.dataset.visibleMedicineSplash="hidden";document.body.classList.remove("splash-open");var content=document.getElementById("visible-medicine-site-content");if(content){content.inert=false;content.removeAttribute("aria-hidden");}},10000);})();`;
