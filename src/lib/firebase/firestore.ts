import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  onSnapshot,
  GeoPoint,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { Farm, GateValve } from '../data';

const FARMS_COLLECTION = 'farms';

export async function addFarm(
  userId: string,
  farmData: Omit<Farm, 'id' | 'ownerId'>
) {
  const gateValves = farmData.gateValves.map((valve) => {
    if ('lat' in valve.position && 'lng' in valve.position) {
      return {
        ...valve,
        position: new GeoPoint(valve.position.lat, valve.position.lng),
      };
    }
    return valve;
  });

  await addDoc(collection(db, FARMS_COLLECTION), {
    ...farmData,
    gateValves,
    ownerId: userId,
  });
}

export function getFarms(
  userId: string,
  callback: (farms: Farm[]) => void
): () => void {
  const q = query(collection(db, FARMS_COLLECTION), where('ownerId', '==', userId));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const farms: Farm[] = [];
    querySnapshot.forEach((doc) => {
      farms.push({ id: doc.id, ...doc.data() } as Farm);
    });
    callback(farms);
  });

  return unsubscribe;
}

export async function deleteFarm(farmId: string) {
  await deleteDoc(doc(db, FARMS_COLLECTION, farmId));
}

export async function toggleValveStatus(farmId: string, valveId: string) {
  const farmRef = doc(db, FARMS_COLLECTION, farmId);
  const batch = writeBatch(db);

  // This is a simplified version. In a real app, you might need to read the doc first
  // to get the current status and then update it.
  // For simplicity, we are assuming we can construct the object to update without reading.
  // This is not robust if other fields in the valve object can change.
  
  // To correctly toggle, we need to read the farm doc first.
  // This operation should ideally be in a transaction.
  // For this prototype, we'll keep it simple but it's not atomic.
  const tempDoc = await getDocs(query(collection(db, FARMS_COLLECTION), where('__name__', '==', farmId)));
  if (tempDoc.docs.length > 0) {
    const farm = tempDoc.docs[0].data() as Farm;
    const valveToUpdate = farm.gateValves.find(v => v.id === valveId);
    if (valveToUpdate) {
        const newStatus = valveToUpdate.status === 'open' ? 'closed' : 'open';
        const updatedValve = {...valveToUpdate, status: newStatus};

        // Firestore doesn't have a direct way to update an element in an array.
        // We have to remove the old one and add the new one.
        batch.update(farmRef, { gateValves: arrayRemove(valveToUpdate) });
        batch.update(farmRef, { gateValves: arrayUnion(updatedValve) });
        await batch.commit();
    }
  }
}

export async function closeAllValves(farmId: string) {
    const farmRef = doc(db, FARMS_COLLECTION, farmId);
    const tempDoc = await getDocs(query(collection(db, FARMS_COLLECTION), where('__name__', '==', farmId)));

    if (tempDoc.docs.length > 0) {
        const farm = tempDoc.docs[0].data() as Farm;
        const batch = writeBatch(db);

        const updatedValves = farm.gateValves.map(valve => ({
            ...valve,
            status: 'closed'
        }));

        batch.update(farmRef, { gateValves: updatedValves });
        await batch.commit();
    }
}
