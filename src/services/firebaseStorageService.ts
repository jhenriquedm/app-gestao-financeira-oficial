import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { ReceiptAttachment } from '../types';

export class FirebaseStorageService {
  /**
   * Faz upload de um anexo para o Firebase Storage se ele possuir dataUrl (Base64).
   * Retorna o comprovante com a `fileUrl` pública/segura da nuvem preenchida.
   */
  static async uploadAttachment(
    userId: string,
    attachment: ReceiptAttachment
  ): Promise<ReceiptAttachment> {
    // Se já tiver fileUrl válida na nuvem e não houver alteração, mantém
    if (attachment.fileUrl && (!attachment.dataUrl || !attachment.dataUrl.startsWith('data:'))) {
      return attachment;
    }

    if (!attachment.dataUrl || !attachment.dataUrl.startsWith('data:')) {
      return attachment;
    }

    try {
      const sanitizedName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `users/${userId}/attachments/${attachment.id}_${sanitizedName}`;
      const storageRef = ref(storage, storagePath);

      // Upload do arquivo em formato data_url
      await uploadString(storageRef, attachment.dataUrl, 'data_url', {
        contentType: attachment.type || 'application/octet-stream',
      });

      const fileUrl = await getDownloadURL(storageRef);

      return {
        ...attachment,
        fileUrl,
        storagePath,
      };
    } catch (error) {
      console.warn(`[FirebaseStorage] Falha ao enviar ${attachment.name} para o Storage:`, error);
      // Fallback seguro: mantém o attachment local intacto sem quebrar o fluxo
      return attachment;
    }
  }

  /**
   * Baixa o anexo remoto e converte para Base64 Data URL (para cache local no IndexedDB)
   */
  static async fetchAttachmentAsDataUrl(fileUrl: string): Promise<string | null> {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('[FirebaseStorage] Falha ao baixar anexo remoto para cache:', err);
      return null;
    }
  }
}
