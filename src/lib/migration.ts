
import { db, collection, doc, setDoc, getDocs, deleteDoc } from '../firebase';
import { mockDb } from './mockDb';

export async function migrateMockToFirestore(onProgress?: (progress: number) => void) {
  console.log('Starting migration from mock storage to Firestore...');
  
  const collections = [
    'users',
    'healthRecords',
    'activities',
    'queries',
    'announcements',
    'reservations',
    'breakfastReservations',
    'marketplaceItems'
  ];

  let totalItems = 0;
  for (const colName of collections) {
    totalItems += mockDb.getCollection(colName as any).length;
  }

  if (totalItems === 0) {
    onProgress?.(100);
    return;
  }

  let processedItems = 0;
  for (const colName of collections) {
    console.log(`Migrating collection: ${colName}`);
    const data = mockDb.getCollection(colName as any);
    
    for (const item of data) {
      try {
        const { id, ...rest } = item;
        const docId = id || Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, colName, docId), {
          ...rest,
          migratedAt: new Date().toISOString()
        });
        processedItems++;
        onProgress?.(Math.round((processedItems / totalItems) * 100));
        console.log(`  Migrated ${colName} item: ${docId}`);
      } catch (error) {
        console.error(`  Error migrating ${colName} item:`, error);
      }
    }
  }
  
  console.log('Migration complete!');
}

export async function clearFirestoreData() {
  if (!confirm('This will delete ALL data in Firestore. Are you sure?')) return;
  
  const collections = [
    'users',
    'healthRecords',
    'activities',
    'queries',
    'announcements',
    'reservations',
    'breakfastReservations',
    'marketplaceItems'
  ];

  for (const colName of collections) {
    const snapshot = await getDocs(collection(db, colName));
    for (const document of snapshot.docs) {
      await deleteDoc(doc(db, colName, document.id));
    }
  }
  alert('Firestore data cleared.');
}

export async function migrateSqliteToFirestore(onProgress?: (progress: number) => void) {
  console.log('Starting migration from SQLite to Firestore...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to dump the SQLite database.');
    return;
  }

  try {
    const response = await fetch('/api/admin/dump-db', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch SQLite dump');
    
    const dump = await response.json();
    
    // Mapping SQLite tables to Firestore collections
    const tableMap: any = {
      'users': 'users',
      'health_records': 'healthRecords',
      'activities': 'activities',
      'queries': 'queries',
      'announcements': 'announcements',
      'vegetables': 'vegetables',
      'breakfast_items': 'breakfastItems',
      'breakfast_reservations': 'breakfastReservations'
    };

    let totalItems = 0;
    for (const table of Object.keys(tableMap)) {
      totalItems += (dump[table] || []).length;
    }

    if (totalItems === 0) {
      onProgress?.(100);
      return;
    }

    let processedItems = 0;
    for (const [table, colName] of Object.entries(tableMap)) {
      const data = dump[table as string] || [];
      console.log(`Migrating ${table} to ${colName} (${data.length} items)`);
      
      for (const item of data) {
        const { id, ...rest } = item;
        const docId = id.toString();
        await setDoc(doc(db, colName as string, docId), {
          ...rest,
          migratedFrom: 'sqlite',
          migratedAt: new Date().toISOString()
        });
        processedItems++;
        onProgress?.(Math.round((processedItems / totalItems) * 100));
      }
    }
    
    alert('SQLite to Firestore migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
    alert('Error during SQLite migration.');
  }
}
