import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage = inject(Storage);

  async uploadReceipt(file: File, expenseId: string): Promise<string> {
    const storageRef = ref(this.storage, `receipts/${expenseId}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
}
