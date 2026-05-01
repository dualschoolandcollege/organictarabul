import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, where, getDocs, deleteDoc, limit } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isVerified: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isVerified: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdminState, setIsAdminState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      const SUPER_ADMIN_EMAIL = 'mohaiminul201104@gmail.com';
      const isSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
      
      // Initial state based on super admin status
      setIsAdminState(isSuperAdmin);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user) {
        const docRef = doc(db, 'users', user.uid);
        
        unsubscribeProfile = onSnapshot(docRef, async (docSnap) => {
          let currentProfileData: UserProfile | null = null;
          
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            currentProfileData = data;
            
            // Check for any pending elevation or cleanup
            if (!isSuperAdmin) {
              const userEmail = (user.email || '').trim().toLowerCase();
              try {
                const appointmentSnap = await getDoc(doc(db, 'admin_appointments', userEmail));
                
                if (appointmentSnap.exists()) {
                  if (data.role !== UserRole.ADMIN) {
                    console.log(`Elevating existing user ${userEmail} to admin via appointment`);
                    setProfile({ ...data, role: UserRole.ADMIN });
                    setIsAdminState(true);
                    await updateDoc(docRef, { role: UserRole.ADMIN });
                  }
                  // Clean up appointment regardless if already admin or newly elevated
                  await deleteDoc(appointmentSnap.ref);
                  if (data.role !== UserRole.ADMIN) {
                    setLoading(false);
                    return;
                  }
                }
              } catch (e) {
                console.warn('Appointment cleanup check failed:', e);
              }
            }
          } else {
            console.log('Profile does not exist, checking for appointment or creating default...');
            const userEmail = (user.email || '').trim().toLowerCase();
            let role = isSuperAdmin ? UserRole.ADMIN : UserRole.CUSTOMER;
            let appointmentToDoc: any = null;
            
            try {
              const appointmentSnap = await getDoc(doc(db, 'admin_appointments', userEmail));
              
              if (appointmentSnap.exists()) {
                console.log(`New user ${userEmail} has admin appointment`);
                role = UserRole.ADMIN;
                // Set state early
                setIsAdminState(true);
                appointmentToDoc = appointmentSnap.ref;
              }
            } catch (e) {
              console.warn('Appointment check failed:', e);
            }

            const newProfile: UserProfile = {
              uid: user.uid,
              email: userEmail,
              role: role,
              createdAt: new Date().toISOString(),
            };
            
            try {
              if (userEmail) {
                await setDoc(docRef, newProfile);
                currentProfileData = newProfile;
                
                // Only delete appointment AFTER successful profile creation
                if (appointmentToDoc) {
                  await deleteDoc(appointmentToDoc);
                }
              }
            } catch (err) {
              console.error('Failed to create profile:', err);
            }
          }

          if (currentProfileData) {
            setProfile(currentProfileData);
            setIsAdminState(currentProfileData.role === UserRole.ADMIN || isSuperAdmin);
          }
          setLoading(false);
        }, (error) => {
          console.error('Profile listener error:', error);
          // If we can't read the profile, we still need to stop loading
          setLoading(false);
        });
      } else {
        setProfile(null);
        setIsAdminState(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: isAdminState,
        isVerified: user?.emailVerified === true || isAdminState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
