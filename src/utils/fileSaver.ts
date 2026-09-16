import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface NativeFileManagerPlugin {
  isAvailable(): Promise<{ available: boolean; platform: string }>;
  saveToDownloads(options: {
    fileName: string;
    content: string;
    mimeType: string;
  }): Promise<{
    success: boolean;
    folder?: string;
    fileName?: string;
    uri?: string;
    message?: string;
  }>;
  chooseFolderAndSave(options: {
    fileName: string;
    content: string;
    mimeType: string;
  }): Promise<{
    success: boolean;
    uri?: string;
    message?: string;
  }>;
}

const NativeFileManager = registerPlugin<NativeFileManagerPlugin>('NativeFileManager');

export interface SaveFileOptions {
  fileName: string;
  content: string;
  mimeType: string;
  chooseFolder?: boolean;
}

export interface SaveResult {
  success: boolean;
  message: string;
  folder?: string;
  uri?: string;
}

/**
 * Salva o arquivo no dispositivo.
 * - No Android:
 *    * Se chooseFolder = true: abre o seletor do sistema (SAF) para o usuário escolher qualquer pasta (Downloads, Documentos, Drive, SD Card).
 *    * Se chooseFolder = false: salva obrigatoriamente e diretamente na pasta pública 'Download' do celular via MediaStore do Android.
 * - Na Web:
 *    * Tenta showSaveFilePicker (se disponível) ou faz download automático padrão do navegador.
 */
export async function saveFile(options: {
  fileName: string;
  content: string;
  mimeType: string;
  chooseFolder?: boolean;
}): Promise<SaveResult> {
  const { fileName, content, mimeType, chooseFolder = false } = options;

  // 1. DISPOSITIVO NATIVO (Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      if (chooseFolder) {
        // Abrir seletor oficial de pastas do Android (Storage Access Framework)
        const res = await NativeFileManager.chooseFolderAndSave({
          fileName,
          content,
          mimeType,
        });
        return {
          success: true,
          message: res.message || 'Arquivo salvo com sucesso na pasta escolhida!',
          uri: res.uri,
        };
      } else {
        // Salvar diretamente na pasta Download pública do telefone
        const res = await NativeFileManager.saveToDownloads({
          fileName,
          content,
          mimeType,
        });
        return {
          success: true,
          folder: 'Download',
          message: res.message || `Arquivo salvo na pasta Download (${fileName})!`,
          uri: res.uri,
        };
      }
    } catch (nativeErr: unknown) {
      const errMsg = nativeErr instanceof Error ? nativeErr.message : String(nativeErr);

      // Se o usuário cancelou o seletor de pasta, não consideramos falha de sistema
      if (errMsg.includes('cancelada') || errMsg.includes('canceled')) {
        return {
          success: false,
          message: 'Ação cancelada pelo usuário.',
        };
      }

      console.warn('Falha no NativeFileManager, tentando Filesystem e Share:', errMsg);

      // Fallback: Escrever no Cache/Documents com Capacitor Filesystem e abrir o menu nativo de compartilhamento
      try {
        const fileResult = await Filesystem.writeFile({
          path: fileName,
          data: content,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: fileName,
          text: `Arquivo gerado: ${fileName}`,
          url: fileResult.uri,
          dialogTitle: 'Salvar ou Compartilhar Arquivo',
        });

        return {
          success: true,
          message: 'Arquivo gerado e aberto no menu para salvar ou compartilhar!',
          uri: fileResult.uri,
        };
      } catch (fallbackErr: unknown) {
        const fbMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        return {
          success: false,
          message: `Erro ao salvar arquivo no celular: ${fbMsg}`,
        };
      }
    }
  }

  // 2. AMBIENTE WEB (Navegador Desktop / Chrome)
  if (chooseFolder && typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      // API moderna de escolha de pasta/arquivo na Web
      const fileHandle = await (window as unknown as {
        showSaveFilePicker: (opts: {
          suggestedName: string;
          types: Array<{ description: string; accept: Record<string, string[]> }>;
        }) => Promise<FileSystemFileHandle>;
      }).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: mimeType.includes('csv') ? 'Planilha CSV' : 'Arquivo JSON',
            accept: { [mimeType]: [fileName.endsWith('.csv') ? '.csv' : '.json'] },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      return {
        success: true,
        message: `Arquivo ${fileName} salvo com sucesso no local escolhido!`,
      };
    } catch (webErr: unknown) {
      const wMsg = webErr instanceof Error ? webErr.message : String(webErr);
      if (wMsg.includes('Abort') || wMsg.includes('cancel')) {
        return { success: false, message: 'Operação cancelada pelo usuário.' };
      }
    }
  }

  // Fallback padrão Web com Blob e link <a>
  try {
    let blob: Blob;
    if (content.startsWith('data:')) {
      const fetchRes = await fetch(content);
      blob = await fetchRes.blob();
    } else {
      blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: `Download de ${fileName} iniciado com sucesso!`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: `Falha ao realizar download: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Salva ou faz o download de um comprovante anexado (PDF, DOCX, Imagem).
 * Forçado diretamente para a pasta de downloads de qualquer smartphone por debaixo dos panos,
 * sem exibir detalhes de pastas ou diretórios ao usuário.
 */
export async function saveAttachmentFile(attachment: {
  name: string;
  type: string;
  dataUrl: string;
}): Promise<SaveResult> {
  const res = await saveFile({
    fileName: attachment.name,
    content: attachment.dataUrl,
    mimeType: attachment.type || 'application/octet-stream',
    chooseFolder: false, // Força diretamente para Downloads
  });

  return {
    ...res,
    message: res.success ? 'Comprovante baixado com sucesso!' : (res.message || 'Falha ao baixar comprovante.'),
  };
}

/**
 * Abre o menu nativo de compartilhamento do celular (WhatsApp, Drive, Email, Gerenciador de Arquivos).
 */
export async function shareFile(options: {
  fileName: string;
  content: string;
  mimeType: string;
}): Promise<SaveResult> {
  const { fileName, content } = options;

  if (Capacitor.isNativePlatform()) {
    try {
      const fileResult = await Filesystem.writeFile({
        path: fileName,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: fileName,
        text: `Arquivo gerado pelo Gestão Financeira: ${fileName}`,
        url: fileResult.uri,
        dialogTitle: 'Compartilhar ou Salvar no Aparelho',
      });

      return {
        success: true,
        message: 'Menu de compartilhamento aberto com sucesso!',
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: `Não foi possível compartilhar: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // Web navigator.share se suportado
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const blob = new Blob([content], { type: options.mimeType });
      const file = new File([blob], fileName, { type: options.mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: `Arquivo gerado pelo Gestão Financeira: ${fileName}`,
        });
        return { success: true, message: 'Compartilhado com sucesso!' };
      }
    } catch {
      // Fallback
    }
  }

  // Se não suportar share, faz download
  return saveFile({ ...options, chooseFolder: false });
}
