# Firebase Migration Guide

This application is structured to easily migrate from localStorage to Firebase. The database layer is abstracted through the `IDatabaseService` interface.

## Current Setup

- **Database**: LocalStorageDatabaseService (stores data in browser localStorage)
- **Location**: `src/app/services/local-storage-database.service.ts`
- **Interface**: `src/app/services/database.interface.ts`

## Migration Steps

### 1. Install Firebase

```bash
npm install firebase @angular/fire
```

### 2. Configure Firebase

Create a Firebase project at https://console.firebase.google.com/

Add your Firebase configuration to `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
  }
};
```

### 3. Update app.config.ts

```typescript
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { IDatabaseService } from './services/database.interface';
import { FirebaseDatabaseService } from './services/firebase-database.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    { provide: IDatabaseService, useClass: FirebaseDatabaseService },
  ],
};
```

### 4. Implement FirebaseDatabaseService

Update `src/app/services/firebase-database.service.ts` with actual Firebase Firestore implementation:

```typescript
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { IDatabaseService } from './database.interface';
import { Resident, CertificateRequest, Household, SystemUser, Role } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDatabaseService implements IDatabaseService {
  private firestore = inject(Firestore);

  getResidents(): Observable<Resident[]> {
    const residentsRef = collection(this.firestore, 'residents');
    return from(getDocs(residentsRef)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resident)))
    );
  }

  getResidentById(id: string): Observable<Resident | null> {
    const residentRef = doc(this.firestore, `residents/${id}`);
    return from(getDoc(residentRef)).pipe(
      map(docSnap => docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Resident : null)
    );
  }

  // Implement other methods similarly...
}
```

### 5. Update DataService

Change the constructor in `src/app/services/data.service.ts`:

```typescript
constructor(
  private database: IDatabaseService  // Now uses the interface
) {
  this.initializeData();
}
```

### 6. Create Firestore Collections

In Firebase Console, create the following collections:
- `residents`
- `requests`
- `households`
- `users`
- `roles`

### 7. Set Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Benefits

- ✅ Data persists across browser sessions
- ✅ Real-time updates across multiple devices
- ✅ Scalable cloud infrastructure
- ✅ Built-in authentication
- ✅ No code changes needed in components (DataService API remains the same)

## Rollback

To rollback to localStorage, simply:
1. Remove Firebase providers from `app.config.ts`
2. Change DataService constructor back to `LocalStorageDatabaseService`
3. Remove Firebase dependencies (optional)
