// Utility to count categories in the female database
export function countCategoriesInDatabase() {
  console.log('🔍 Iniciando contagem de categorias...');
  
  // Try to get females from different sources like the getFemalesByFarm function
  let allFemales: any[] = [];
  
  // Check ToolSS cache first
  const toolssCache = (window as any).ToolSS?.cache?.femalesByFarm;
  if (toolssCache) {
    console.log('📊 ToolSS cache keys:', Object.keys(toolssCache));
    // Get females from all farms
    for (const farmId of Object.keys(toolssCache)) {
      if (Array.isArray(toolssCache[farmId])) {
        allFemales = allFemales.concat(toolssCache[farmId]);
        console.log(`🏠 Farm ${farmId}: ${toolssCache[farmId].length} fêmeas`);
      }
    }
  }
  
  // Check localStorage  
  try {
    const localData = localStorage.getItem("toolss.femalesByFarm");
    if (localData) {
      const parsed = JSON.parse(localData);
      console.log('💾 localStorage femalesByFarm keys:', Object.keys(parsed));
      for (const farmId of Object.keys(parsed)) {
        if (Array.isArray(parsed[farmId])) {
          allFemales = allFemales.concat(parsed[farmId]);
          console.log(`🏠 Farm ${farmId} (localStorage): ${parsed[farmId].length} fêmeas`);
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Error parsing localStorage:', e);
  }
  
  // Also check toolss_clients_v2_with_500_females
  try {
    const clientsData = localStorage.getItem("toolss_clients_v2_with_500_females");
    if (clientsData) {
      const clients = JSON.parse(clientsData);
      console.log('👥 Clients with female data:', clients.length);
      for (const client of clients) {
        if (client.farms) {
          for (const farm of client.farms) {
            if (Array.isArray(farm.females)) {
              allFemales = allFemales.concat(farm.females);
              console.log(`🏠 Client ${client.id} Farm ${farm.id}: ${farm.females.length} fêmeas`);
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Error parsing clients data:', e);
  }

  console.log(`📈 Total fêmeas encontradas: ${allFemales.length}`);
  
  if (allFemales.length === 0) {
    console.log('❌ Nenhuma fêmea encontrada no banco de dados');
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

  // Show sample of data first
  console.log('📋 Exemplo das primeiras 3 fêmeas:', allFemales.slice(0, 3).map(f => ({
    nome: f.nome,
    categoria: f.categoria,
    ordemParto: f.ordemParto
  })));

  // Count each category
  for (const female of allFemales) {
    const categoria = female.categoria;
    
    if (!categoria) {
      categoryCounts.outros++;
      continue;
    }
    
    const cat = String(categoria).trim().toLowerCase();
    
    if (cat.includes('novilha')) {
      categoryCounts.novilhas++;
    } else if (cat.includes('primípara') || cat.includes('primipara')) {
      categoryCounts.primiparas++;
    } else if (cat.includes('secundípara') || cat.includes('secundipara')) {
      categoryCounts.secundiparas++;  
    } else if (cat.includes('multípara') || cat.includes('multipara')) {
      categoryCounts.multiparas++;
    } else {
      categoryCounts.outros++;
      console.log(`❓ Categoria não reconhecida: "${categoria}"`);
    }
  }

  console.log('📊 CONTAGEM DE CATEGORIAS:');
  console.log(`🐄 Novilhas: ${categoryCounts.novilhas}`);
  console.log(`🥛 Primíparas: ${categoryCounts.primiparas}`);
  console.log(`🐮 Secundíparas: ${categoryCounts.secundiparas}`);
  console.log(`🏆 Multíparas: ${categoryCounts.multiparas}`);
  console.log(`❓ Outros/Vazios: ${categoryCounts.outros}`);
  console.log(`📈 Total: ${categoryCounts.total}`);

  return categoryCounts;
}

// Auto-run the counter
if (typeof window !== 'undefined') {
  // Wait a bit for data to load
  setTimeout(() => {
    countCategoriesInDatabase();
  }, 2000);
}