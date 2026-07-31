const matomoUrl = 'https://matomo.ciberterminal.net/';

let initialized = false;

function initializeMatomo() {
  const queue = window._paq = window._paq || [];

  if (initialized) {
    return queue;
  }

  queue.push([ 'setTrackerUrl', `${matomoUrl}matomo.php` ]);
  queue.push([ 'setSiteId', '2' ]);
  queue.push([ 'enableLinkTracking' ]);

  const script = document.createElement('script');
  script.async = true;
  script.src = `${matomoUrl}matomo.js`;
  document.head.appendChild(script);

  initialized = true;
  return queue;
}

const clientModule = {
  onRouteDidUpdate({location, previousLocation}) {
    if (previousLocation && location.pathname === previousLocation.pathname &&
        location.search === previousLocation.search &&
        location.hash === previousLocation.hash) {
      return;
    }

    const queue = initializeMatomo();

    // Docusaurus updates the document title after the route lifecycle callback.
    setTimeout(() => {
      queue.push([ 'setCustomUrl', window.location.href ]);
      queue.push([ 'setDocumentTitle', document.title ]);
      queue.push([ 'trackPageView' ]);
    });
  },
};

export default clientModule;
