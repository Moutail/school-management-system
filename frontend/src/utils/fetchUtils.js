// fetchUtils.js
export const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return await response.json();
      throw new Error(`Erreur HTTP: ${response.status}`);
    } catch (error) {
      console.warn(`Tentative ${retries + 1}/${maxRetries} échouée pour ${url}: ${error.message}`);
      retries++;
      
      if (retries >= maxRetries) throw error;
      
      // Attendre avant de réessayer (backoff exponentiel)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
};
