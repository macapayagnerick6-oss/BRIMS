const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// IMPORTANT:
// - Download your service account key JSON from:
//   Firebase Console → Project Settings → Service accounts → Generate new private key
// - Save it in the project root as "serviceAccountKey.json"
// - DO NOT commit that file to Git.
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedCollection(collectionName, items) {
  if (!Array.isArray(items)) {
    console.warn(`No array found for collection "${collectionName}", skipping.`);
    return;
  }

  for (const item of items) {
    if (!item) continue;

    const rawId = item.id ?? '';
    const id = String(rawId).trim();

    if (!id) {
      console.warn(`Skipping ${collectionName} item without valid "id":`, item);
      continue;
    }

    await db.collection(collectionName).doc(id).set(item, { merge: true });
    console.log(`Imported ${collectionName}/${id}`);
  }
}

async function main() {
  try {
    const dataPath = path.join(__dirname, '..', 'server', 'db.json');
    const raw = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(raw);

    const collections = ['residents', 'requests', 'households', 'users', 'roles'];

    for (const name of collections) {
      await seedCollection(name, data[name]);
    }

    console.log('Finished seeding Firestore from server/db.json');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding Firestore:', err);
    process.exit(1);
  }
}

main();

