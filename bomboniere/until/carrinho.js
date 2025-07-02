import { db } from "../src/firebase/firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export async function buscarPendencias() {
  const snapshot = await getDocs(collection(db, "ingressos"));
  const pendentes = snapshot.docs
    .filter((doc) => doc.data().pago === false)
    .map((doc) => ({ id: doc.id, ...doc.data() }));
  return pendentes;
}

export async function removerIngresso(id) {
  await deleteDoc(doc(db, "ingressos", id));
}
