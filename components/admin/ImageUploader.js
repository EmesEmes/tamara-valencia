"use client";
import { useState } from "react";
import Image from "next/image";

export default function ImageUploader({
  currentImage,
  onImageUpload,
  productCode = "",
  requireCode = true,
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || "");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar código solo si es requerido
    if (requireCode && (!productCode || productCode.trim() === "")) {
      alert(
        "Por favor, ingresa el código del producto antes de subir la imagen"
      );
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no debe superar los 5MB");
      return;
    }

    try {
      setUploading(true);

      // Generar nombre para el archivo
      // Generar nombre para el archivo
      let publicId;
      if (productCode && productCode.trim() !== "") {
        // Limpiar el nombre para que sea válido en Cloudinary
        // Elimina caracteres especiales, reemplaza espacios por guiones y convierte a minúsculas
        publicId = productCode
          .trim()
          .replace(/[^a-zA-Z0-9\s-]/g, "") // Eliminar caracteres especiales
          .replace(/\s+/g, "-") // Reemplazar espacios por guiones
          .toLowerCase(); // Convertir a minúsculas
      } else {
        // Generar nombre automático solo si no hay código/nombre
        publicId = `conjunto-${Date.now()}`;
      }

      // Crear FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "tamara_valencia"
      );
      formData.append("folder", "tamara-valencia");
      formData.append("public_id", publicId);

      // Subir a Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      // Actualizar preview y notificar al padre
      setPreview(data.secure_url);
      onImageUpload(data.secure_url, data.public_id);

      alert("Imagen subida exitosamente");
    } catch (error) {
      console.error("Error al subir imagen:", error);
      alert("Error al subir la imagen. Por favor, intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (confirm("¿Estás seguro de eliminar esta imagen?")) {
      setPreview("");
      onImageUpload("", "");
    }
  };

  const isDisabled = requireCode && (!productCode || productCode.trim() === "");

  return (
    <div className="space-y-4">
      {requireCode && !productCode && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          <strong>Nota:</strong> Debes ingresar el código del producto antes de
          subir la imagen.
        </div>
      )}

      {preview ? (
        <div className="space-y-4">
          <div className="relative w-64 h-64 mx-auto bg-gray-100 border border-gray-300">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              sizes="256px"
            />
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              Eliminar imagen
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            ></path>
          </svg>
          <p className="text-gray-600 mb-4">No hay imagen seleccionada</p>
        </div>
      )}

      <div className="text-center">
        <label
          htmlFor="file-upload"
          className={`inline-block px-6 py-3 bg-gray-900 text-white text-sm uppercase tracking-wider transition-colors cursor-pointer ${
            isDisabled || uploading
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-800"
          }`}
        >
          {uploading
            ? "Subiendo..."
            : preview
            ? "Cambiar imagen"
            : "Seleccionar imagen"}
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading || isDisabled}
          className="hidden"
        />
      </div>

      <p className="text-sm text-gray-500 text-center">
        Formatos aceptados: JPG, PNG, WEBP. Tamaño máximo: 5MB
        {requireCode && productCode && (
          <>
            <br />
            La imagen se guardará como: <strong>{productCode}</strong>
          </>
        )}
      </p>
    </div>
  );
}
