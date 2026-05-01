import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, setDoc, deleteDoc, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { UserRole, UserProfile } from '../../types';
import { Users, Shield, ShieldAlert, Search, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export default function AdminUsers() {
  const { user: currentUser, profile: currentProfile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [fullList, setFullList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path,
      authInfo: {
        userId: currentUser?.uid,
        email: currentUser?.email,
      }
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
    return JSON.stringify(errInfo);
  };

  useEffect(() => {
    if (authLoading || !currentUser) return;

    setLoading(true);
    setErrorMsg(null);

    // Listen to admins, latest users, and appointments independently
    const qAdmins = query(collection(db, 'users'), where('role', '==', 'admin'));
    const qLatest = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(500));
    const qApps = query(collection(db, 'admin_appointments'), limit(200));
    
    let adminsData: UserProfile[] = [];
    let latestData: UserProfile[] = [];
    let appsData: any[] = [];

    const updateCombinedList = () => {
      const superAdminEmail = 'mohaiminul201104@gmail.com';
      
      // Merge admins and latest users, avoiding duplicates
      const usersMap = new Map<string, UserProfile>();
      adminsData.forEach(u => usersMap.set(u.uid, u));
      latestData.forEach(u => {
        if (!usersMap.has(u.uid)) usersMap.set(u.uid, u);
      });
      
      let combined = Array.from(usersMap.values());

      // Convert appointments to UserProfile shape
      const appProfiles: UserProfile[] = appsData.map(app => ({
        uid: `appointed_${app.email}`,
        email: app.email,
        role: UserRole.ADMIN,
        createdAt: app.createdAt,
        isPlaceholder: true
      }));

      // Add appointments if not already present as real users
      appProfiles.forEach(app => {
        const lowerAppEmail = (app.email || '').toLowerCase();
        if (!combined.some(u => (u.email || '').toLowerCase() === lowerAppEmail)) {
          combined.push(app);
        }
      });

      combined.sort((a, b) => {
        const isSuperA = a.email?.toLowerCase() === superAdminEmail;
        const isSuperB = b.email?.toLowerCase() === superAdminEmail;
        if (isSuperA) return -1;
        if (isSuperB) return 1;
        
        const isAdmA = a.role === UserRole.ADMIN || a.isPlaceholder;
        const isAdmB = b.role === UserRole.ADMIN || b.isPlaceholder;
        
        if (isAdmA && !isAdmB) return -1;
        if (!isAdmA && isAdmB) return 1;
        
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setUsers(combined);
      setFullList(combined);
      setLoading(false);
    };

    const unsubscribeAdmins = onSnapshot(qAdmins, (snapshot) => {
      adminsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      } as UserProfile));
      updateCombinedList();
    }, (error) => {
      console.error('Snapshot error (admins):', error);
      // If index fails, we might still have them in qLatest, or we fallback
      if (error.message.includes('requires an index')) {
        // Fallback: fetch all and filter in client (less efficient but works)
        const qFallback = query(collection(db, 'users'), limit(100));
        onSnapshot(qFallback, (s) => {
           // We'll trust qLatest to catch most things
        });
      }
    });

    const unsubscribeLatest = onSnapshot(qLatest, (snapshot) => {
      latestData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      } as UserProfile));
      updateCombinedList();
    }, (error) => {
      console.error('Snapshot error (latest users):', error);
      setErrorMsg(handleFirestoreError(error, OperationType.LIST, 'users'));
      setLoading(false);
    });

    const unsubscribeApps = onSnapshot(qApps, (snapshot) => {
      appsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      updateCombinedList();
    }, (error) => {
      console.warn('Snapshot warning (appointments):', error);
    });

    return () => {
      unsubscribeAdmins();
      unsubscribeLatest();
      unsubscribeApps();
    };
  }, [authLoading, currentUser?.uid]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchStr = searchEmail.trim();
    if (!searchStr) {
      setUsers(fullList);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setUsers([]); 
    try {
      const lowerSearch = searchStr.toLowerCase();
      const resultsMap = new Map<string, UserProfile>();
      const superAdminEmail = 'mohaiminul201104@gmail.com';

      // 1. Check local cache (fullList) - very robust match
      fullList.forEach(u => {
        const uEmail = (u.email || '').toLowerCase();
        const uUid = u.uid || '';
        if (uEmail === lowerSearch || uUid === searchStr || uEmail.includes(lowerSearch) || uUid.includes(searchStr)) {
          resultsMap.set(uUid, u);
        }
      });

      // 2. Direct Firestore Queries (Case-insensitive variations)
      const variations = Array.from(new Set([
        searchStr,
        lowerSearch,
        searchStr.charAt(0).toUpperCase() + searchStr.slice(1),
        searchStr.toUpperCase(),
        superAdminEmail,
        'Mohaiminul201104@gmail.com',
        'mohaiminul201104@gmail.com'
      ])).filter(Boolean);

      // Max 10 items per 'in' query
      for (let i = 0; i < variations.length; i += 10) {
        const chunk = variations.slice(i, i + 10);
        try {
          const q = query(collection(db, 'users'), where('email', 'in', chunk));
          const snap = await getDocs(q);
          snap.docs.forEach(d => {
            const data = d.data() as UserProfile;
            resultsMap.set(data.uid, data);
          });
        } catch (err) {
          console.warn('Search chunk failed:', chunk, err);
        }
      }

      // 3. Direct UID lookup (Exact)
      if (searchStr.length >= 20 && !resultsMap.has(searchStr)) {
        try {
          const directSnap = await getDoc(doc(db, 'users', searchStr));
          if (directSnap.exists()) {
            const data = directSnap.data() as UserProfile;
            resultsMap.set(data.uid, data);
          }
        } catch (e) {}
      }

      // 4. Case-Insensitive Prefix Fallback
      if (resultsMap.size === 0 && searchStr.length >= 3) {
        try {
          const prefixes = [lowerSearch, searchStr.charAt(0).toUpperCase() + searchStr.slice(1)].filter(p => p.length >= 3);
          for (const p of prefixes) {
            const q = query(collection(db, 'users'), 
              where('email', '>=', p), 
              where('email', '<=', p + '\uf8ff'),
              limit(20)
            );
            const snap = await getDocs(q);
            snap.docs.forEach(d => {
              const data = d.data() as UserProfile;
              resultsMap.set(data.uid, data);
            });
            if (resultsMap.size > 0) break;
          }
        } catch (e) {}
      }

      // 5. Broad Scan Fallback (Up to 1000 users)
      if (resultsMap.size === 0) {
        try {
          const q = query(collection(db, 'users'), limit(1000));
          const scanSnap = await getDocs(q);
          scanSnap.docs.forEach(d => {
            const data = d.data() as UserProfile;
            const email = (data.email || '').toLowerCase();
            const uid = data.uid || '';
            if (email.includes(lowerSearch) || uid.includes(searchStr)) {
              resultsMap.set(uid, data);
            }
          });
        } catch (e) {}
      }

      // 6. Current User Failsafe (Always find self)
      if (currentUser && (currentUser.email?.toLowerCase() === lowerSearch || currentUser.uid === searchStr)) {
        if (!resultsMap.has(currentUser.uid)) {
          resultsMap.set(currentUser.uid, currentProfile || {
            uid: currentUser.uid,
            email: currentUser.email || lowerSearch,
            role: UserRole.ADMIN,
            createdAt: new Date().toISOString()
          });
        }
      }

      setUsers(Array.from(resultsMap.values()));
    } catch (error: any) {
      console.error('Search error:', error);
      setErrorMsg('সার্চ করতে সমস্যা হয়েছে: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchEmail('');
    setUsers(fullList);
    setErrorMsg(null);
  };

  const toggleAdmin = async (user: UserProfile) => {
    if (user.email?.toLowerCase() === 'mohaiminul201104@gmail.com') {
      alert('আপনি মূল অ্যাডমিনের রোল পরিবর্তন করতে পারবেন না।');
      return;
    }

    if (user.uid === currentUser?.uid) {
      alert('আপনি নিজের অ্যাডমিন রোল পরিবর্তন করতে পারবেন না।');
      return;
    }

    setUpdating(user.uid);
    try {
      if (user.isPlaceholder) {
        // Remove appointment
        await deleteDoc(doc(db, 'admin_appointments', user.email));
        alert('অ্যাডমিন অ্যাপয়েন্টমেন্ট বাতিল করা হয়েছে।');
      } else {
        // Toggle real user role
        const newRole = user.role === UserRole.ADMIN ? UserRole.CUSTOMER : UserRole.ADMIN;
        
        try {
          if (newRole === UserRole.ADMIN) {
            // Also create appointment for immediate rule clearance
            const normalizedEmail = (user.email || '').trim().toLowerCase();
            if (normalizedEmail) {
              await setDoc(doc(db, 'admin_appointments', normalizedEmail), {
                email: normalizedEmail,
                createdAt: new Date().toISOString()
              });
            }
          } else {
            // If demoting, remove appointment if it exists
            const normalizedEmail = (user.email || '').trim().toLowerCase();
            if (normalizedEmail) {
              await deleteDoc(doc(db, 'admin_appointments', normalizedEmail)).catch(() => {});
            }
          }

          await updateDoc(doc(db, 'users', user.uid), {
            role: newRole
          });
        } catch (error) {
          console.error('Error updating role:', error);
          alert('রোল পরিবর্তন করতে সমস্যা হয়েছে। সম্ভবত আপনার পর্যাপ্ত পারমিশন নেই।');
        }
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert('রোল পরিবর্তন করতে সমস্যা হয়েছে: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdating(null);
    }
  };

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingNew, setAddingNew] = useState(false);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;

    setAddingNew(true);
    try {
      // 1. Check local list
      let userToUpdate = fullList.find(u => (u.email || '').toLowerCase() === email && !u.isPlaceholder);
      
      // 2. If not found in local list (as a real user), check Firestore directly
      if (!userToUpdate) {
        const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data() as UserProfile;
          userToUpdate = { ...docData, uid: snap.docs[0].id };
        }
      }

      if (userToUpdate) {
        // Real user exists, update them
        if (userToUpdate.role === UserRole.ADMIN) {
          alert('এই ইউজার ইতিমধ্যে অ্যাডমিন হিসেবে আছেন।');
          return;
        } else {
          try {
            // Always create an appointment too, for immediate rule clearance
            const normalizedEmail = email.trim().toLowerCase();
            await setDoc(doc(db, 'admin_appointments', normalizedEmail), {
              email: normalizedEmail,
              createdAt: new Date().toISOString()
            });
            
            await updateDoc(doc(db, 'users', userToUpdate.uid), {
              role: UserRole.ADMIN
            });
            alert('ইউজারকে অ্যাডমিন হিসেবে নিয়োগ দেওয়া হয়েছে।');
            setNewAdminEmail('');
          } catch (error) {
            console.error('Error promoting existing user:', error);
            alert('অ্যাডমিন নিয়োগ করতে সমস্যা হয়েছে। সম্ভবত আপনার পর্যাপ্ত পারমিশন নেই।');
          }
        }
      } else {
        // 3. User definitely doesn't exist yet, create or update appointment
        const normalizedEmail = email.trim().toLowerCase();
        await setDoc(doc(db, 'admin_appointments', normalizedEmail), {
          email: normalizedEmail,
          createdAt: new Date().toISOString()
        });
        alert('নোট: এই ইমেইলের কোন ইউজার প্রোফাইল এখনও তৈরি হয়নি। একটি প্রি-অ্যপয়েন্টমেন্ট তৈরি করা হয়েছে। তিনি যখন এই ইমেইল দিয়ে প্রথমবার লগইন করবেন, স্বয়ংক্রিয়ভাবে অ্যাডমিন হয়ে যাবেন।');
        setNewAdminEmail('');
      }
    } catch (error: any) {
      console.error('Error adding admin:', error);
      alert('অ্যাডমিন যোগ করতে সমস্যা হয়েছে: ' + (error.message || 'Unknown error'));
    } finally {
      setAddingNew(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors font-sans">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <h1 className="text-3xl font-black text-slate-800 font-bengali">অ্যাডমিন ম্যানেজমেন্ট</h1>
        </div>
      </div>

      {/* Quick Add Admin by Email */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-6 text-white">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold font-bengali italic">সরাসরি অ্যাডমিন নিয়োগ (ইমেইল দিয়ে)</h2>
        </div>
        <p className="text-slate-300 text-sm font-bengali">
          যেকোনো ইমেইল দিয়ে এখানে সরাসরি অ্যাডমিন নিয়োগ দিতে পারেন। তিনি রেজিস্টার করা না থাকলেও 
          ভবিষ্যতে এই ইমেইল দিয়ে লগইন করলে অটোমেটিক অ্যাডমিন হিসেবে অ্যাক্সেস পাবেন।
        </p>
        <form onSubmit={handleManualAdd} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input 
              type="email" 
              required
              placeholder="example@gmail.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border-2 border-transparent rounded-xl focus:border-green-500 transition-all outline-none font-sans text-white placeholder:text-slate-500"
            />
          </div>
          <button 
            type="submit"
            disabled={addingNew}
            className="px-8 py-3 bg-green-500 text-white rounded-xl font-bold font-bengali hover:bg-green-600 transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:bg-slate-600 disabled:opacity-50"
          >
            {addingNew ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            অ্যাডমিন হিসেবে নিয়োগ দিন
          </button>
        </form>
      </div>

      {/* Existing Search Admin Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-700 font-bengali">নতুন অ্যাডমিন যোগ করুন</h2>
          <p className="text-sm text-slate-500 font-bengali">ইউজারের ইমেইল দিয়ে সার্চ করে তাকে অ্যাডমিন হিসেবে নিয়োগ দিন।</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="example@gmail.com"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-green-500 focus:bg-white transition-all outline-none font-sans"
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold font-bengali hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            সার্চ করুন
          </button>
          {searchEmail && (
            <button 
              type="button"
              onClick={clearSearch}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold font-bengali hover:bg-slate-200 transition-colors"
            >
              মুছে ফেলুন
            </button>
          )}
        </form>

        <div className="pt-4">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 font-bengali flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">ডাটা লোড করতে সমস্যা হয়েছে</p>
                <p className="text-sm opacity-90">{errorMsg}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider font-sans">
              {searchEmail ? `Search Results for: ${searchEmail}` : `Registered Users (${users.length})`}
            </h2>
            {!searchEmail && (
              <button 
                onClick={() => {
                  setErrorMsg(null);
                  setLoading(true);
                }} 
                className="text-xs font-bold text-green-600 hover:text-green-700 font-bengali bg-green-50 px-3 py-1 rounded-full transition-colors flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                রিফ্রেশ লিস্ট
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 font-bold text-slate-500 font-bengali">ইউজার</th>
                  <th className="pb-4 font-bold text-slate-500 font-bengali text-center">বর্তমান রোল</th>
                  <th className="pb-4 font-bold text-slate-500 font-bengali text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center">
                      <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-400 font-bengali">
                      {searchEmail ? 'এই ইমেইলে কোন ইউজার পাওয়া যায়নি।' : 'কোন ইউজার পাওয়া যায়নি।'}
                    </td>
                  </tr>
                ) : (
                  <>
                    {users.map((user) => (
                      <tr key={user.uid} className="group">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-700">{user.email}</p>
                              <p className="text-[10px] text-slate-400 font-sans uppercase">{user.uid}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold font-bengali ${
                              user.role === UserRole.ADMIN 
                                ? 'bg-red-100 text-red-600' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {user.role === UserRole.ADMIN ? 'অ্যাডমিন' : 'কাস্টমার'}
                            </span>
                            {user.isPlaceholder && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold font-bengali">
                                পেন্ডিং (এখনও লগইন করেননি)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => toggleAdmin(user)}
                            disabled={updating === user.uid || user.email?.toLowerCase() === 'mohaiminul201104@gmail.com'}
                            className={`px-4 py-2 rounded-lg font-bold font-bengali text-sm transition-all ${
                              user.role === UserRole.ADMIN
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            } disabled:opacity-50 disabled:grayscale`}
                          >
                            {updating === user.uid ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                প্রসেসিং...
                              </div>
                            ) : user.role === UserRole.ADMIN ? (
                              <div className="flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" />
                                রিমুভ অ্যাডমিন
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                অ্যাডমিন করুন
                              </div>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
