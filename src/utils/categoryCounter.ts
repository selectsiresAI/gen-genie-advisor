// Utility to count categories in the female database
export function countCategoriesInDatabase() {
  // Try to get females from different sources like the getFemalesByFarm function
  let allFemales: any[] = [];

  // Check ToolSS cache first
  const toolssCache = (window as any).ToolSS?.cache?.femalesByFarm;
  if (toolssCache) {
    // Get females from all farms
    for (const farmId of Object.keys(toolssCache)) {
      if (Array.isArray(toolssCache[farmId])) {
        allFemales = allFemales.concat(toolssCache[farmId]);
      }
    }
  }

  // Check localStorage
  try {
    const localData = localStorage.getItem("toolss.femalesByFarm");
    if (localData) {
      const parsed = JSON.parse(localData);
      for (const farmId of Object.keys(parsed)) {
        if (Array.isArray(parsed[farmId])) {
          allFemales = allFemales.concat(parsed[farmId]);
        }
      }
    }
  } catch (e) {
    // Error parsing localStorage
  }

  // Also check toolss_clients_v2_with_500_females
  try {
    const clientsData = localStorage.getItem("toolss_clients_v2_with_500_females");
    if (clientsData) {
      const clients = JSON.parse(clientsData);
      for (const client of clients) {
        if (client.farms) {
          for (const farm of client.farms) {
            if (Array.isArray(farm.females)) {
              allFemales = allFemales.concat(farm.females);
            }
          }
        }
      }
    }
  } catch (e) {
    // Error parsing clients data
  }

  if (allFemales.length === 0) {
    return {
      novilhas: 0,
      primiparas: 0,
      secundiparas: 0,
      multiparas: 0,
      outros: 0,
      total: 0
    };
  }

  // Count categories
  const categoryCounts = {
    novilhas: 0,
    primiparas: 0,
    secundiparas: 0,
    multiparas: 0,
    outros: 0,
    total: allFemales.length
  };

  // Count each category
  const uniqueCategories = new Set();
  for (const female of allFemales) {
    const categoria = female.categoria;
    if (categoria) uniqueCategories.add(String(categoria).trim());
  }

  for (const female of allFemales) {
    const categoria = female.categoria;

    if (!categoria) {
      categoryCounts.outros++;
      continue;
    }

    // Normalização mais robusta para encoding quebrado
    const cat = String(categoria).trim().toUpperCase();

    if (cat.includes('NOVILHA')) {
      categoryCounts.novilhas++;
    } else if (cat.includes('PRIMÃ') || cat.includes('PRIMA') || cat.includes('PRIMÍPARA') || cat.includes('PRIMIPARA')) {
      categoryCounts.primiparas++;
    } else if (cat.includes('SECUNDÃ') || cat.includes('SECUNDA') || cat.includes('SECUNDÍPARA') || cat.includes('SECUNDIPARA')) {
      categoryCounts.secundiparas++;
    } else if (cat.includes('MULTÃ') || cat.includes('MULTA') || cat.includes('MULTÍPARA') || cat.includes('MULTIPARA')) {
      categoryCounts.multiparas++;
    } else {
      categoryCounts.outros++;
    }
  }

  return categoryCounts;
}

// Auto-run the counter
if (typeof window !== 'undefined') {
  // Wait a bit for data to load
  setTimeout(() => {
    countCategoriesInDatabase();
  }, 2000);
}
