import { Injectable } from "@angular/core"
import imageCompression from "browser-image-compression"

export interface ProcessedImage {
    file: File
    preview: string
    name: string
}

@Injectable({
    providedIn: "root",
})
export class ImageProcessingService {
    constructor() { }

    /**
     * Procesa una imagen para convertirla a JPG, comprimirla y redimensionarla
     * @param file Archivo de imagen original
     * @returns Promesa con la imagen procesada
     */
    async processImage(file: File): Promise<ProcessedImage> {
        try {
            // Opciones de compresión
            const options = {
                maxSizeMB: 0.5, // Comprimir a máximo 500KB
                maxWidthOrHeight: 1280, // Dimensión máxima 1280px
                useWebWorker: true, // Usar Web Worker para no bloquear el hilo principal
                fileType: "image/jpeg", // Convertir a JPG
                initialQuality: 0.8, // Calidad inicial
                alwaysKeepResolution: false, // Permitir redimensionar
            }

            // Comprimir la imagen
            const compressedFile = await imageCompression(file, options)

            // Generar nombre con extensión jpg
            const originalName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name
            const newFileName = `${originalName}.jpg`

            // Crear un nuevo archivo con el nombre correcto
            const processedFile = new File([compressedFile], newFileName, { type: "image/jpeg" })

            // Generar preview para mostrar en la UI
            const preview = await imageCompression.getDataUrlFromFile(processedFile)

            return {
                file: processedFile,
                preview,
                name: newFileName,
            }
        } catch (error) {
            console.error("Error al procesar la imagen:", error)
            throw error
        }
    }

    /**
     * Procesa múltiples imágenes en paralelo
     * @param files Lista de archivos de imagen
     * @returns Promesa con array de imágenes procesadas
     */
    async processMultipleImages(files: File[]): Promise<ProcessedImage[]> {
        const processPromises = Array.from(files).map((file) => this.processImage(file))
        return Promise.all(processPromises)
    }
}
