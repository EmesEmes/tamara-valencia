"use client";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    mensaje: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Formulario enviado:", formData);
    alert("Gracias por contactarnos. Te responderemos pronto.");
    setFormData({ nombre: "", email: "", mensaje: "" });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="py-24 px-4 bg-[#FFF2E0]/10">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-elegant text-5xl font-light text-gray-900 mb-6 font-biloxi">
          Contáctanos
        </h2>

        <div className="w-16 h-px bg-[#FFF2E0] mx-auto mb-8"></div>

        <p className="text-lg text-gray-600 mb-12 font-light">
          ¿Tienes alguna pregunta? Nos encantaría escucharte
        </p>

        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
          <a href={`https://wa.me/593998444531?text=Hola, estoy visitando su página web y necesito información`} target="_blank" className="text-gray-600 hover:text-green-600 hover:underline">
            <svg
              className="w-8 h-8 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
              <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
            </svg>
            <p className="text-sm font-light">+593 99 844 4531</p>
          </a>
          <a href="https://www.facebook.com/TamaraValenciaJoyas" target="_blank" className="text-gray-600 hover:text-blue-600 hover:underline">
            <svg
              className="w-8 h-8 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3" />
            </svg>
            <p className="text-sm font-light">
              Tamara Valencia Diseño de Joyas
            </p>
          </a>

          <a href="https://www.instagram.com/tamaravalenciajoyas" target="_blank" className="text-gray-600 hover:text-pink-600 hover:underline">
            <svg
              className="w-8 h-8 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
              <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              <path d="M16.5 7.5v.01" />
            </svg>
            <p className="text-sm font-light">@tamaravalenciajoyas</p>
          </a>
        </div>
        <div className="mt-10">
          <svg
            className="w-8 h-8 mx-auto mb-2 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
            <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
          </svg>
          <p className="text-sm text-gray-600 font-light">Quito, Ecuador</p>
        </div>
      </div>
    </section>
  );
}
