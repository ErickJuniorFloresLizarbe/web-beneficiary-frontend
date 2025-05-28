import { type ApplicationConfig, importProvidersFrom } from "@angular/core"
import { provideRouter, withComponentInputBinding } from "@angular/router"
import { routes } from "./app.routes"
import { provideAnimations } from "@angular/platform-browser/animations"
import { provideHttpClient, withFetch } from '@angular/common/http';
import { environment } from "../environments/environments"

// Import both the new modular API and the compatibility layer
import { initializeApp } from "@angular/fire/app"
import { getAuth } from "@angular/fire/auth"
import { getFirestore } from "@angular/fire/firestore"
import { provideFirebaseApp } from "@angular/fire/app"
import { provideAuth } from "@angular/fire/auth"
import { provideFirestore } from "@angular/fire/firestore"

// Import the compatibility modules
import { AngularFireModule } from "@angular/fire/compat"
import { AngularFireAuthModule } from "@angular/fire/compat/auth"
import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    provideHttpClient(withFetch()),

    // Add the AngularFireModule for compatibility with AngularFireAuth
    importProvidersFrom(
      AngularFireModule.initializeApp(environment.firebaseConfig),
      AngularFireAuthModule,
      AngularFirestoreModule,
    ),

    // Keep the new modular API providers if you're using them elsewhere
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()), provideAnimationsAsync(),
  ],
}

