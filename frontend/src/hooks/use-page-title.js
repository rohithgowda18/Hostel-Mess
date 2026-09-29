import { useEffect } from 'react';

/**
 * Custom hook to dynamically update document title and meta description per route.
 * @param {string} title Page title
 * @param {string} description Page meta description
 */
export function usePageTitle(title, description) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) {
      document.title = `${title} | MessMaster`;
    }

    let metaDesc = document.querySelector('meta[name="description"]');
    const previousDesc = metaDesc ? metaDesc.getAttribute('content') : '';

    if (description) {
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    return () => {
      document.title = previousTitle;
      if (metaDesc && previousDesc) {
        metaDesc.setAttribute('content', previousDesc);
      }
    };
  }, [title, description]);
}

export default usePageTitle;
