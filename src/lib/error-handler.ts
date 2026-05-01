
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
    },
    operationType,
    path
  };
  
  const errorMessage = `Firestore Error (${operationType} at ${path}): ${errInfo.error}`;
  console.error(errorMessage, JSON.stringify(errInfo));
  
  // Show a user-friendly alert with enough detail to debug
  if (errInfo.error.includes('permissions')) {
    alert(`অ্যাক্সেস ডিনাইড! আপনার এই কাজটি করার পারমিশন নেই। (Path: ${path})\n\nত্রুটি: ${errInfo.error}`);
  } else {
    alert(`সিস্টেম এরর: ${errInfo.error}`);
  }
  
  throw new Error(JSON.stringify(errInfo));
}
