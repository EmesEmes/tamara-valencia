'use client';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Formulario enviado:', formData);
    alert('Gracias por contactarnos. Te responderemos pronto.');
    setFormData({ nombre: '', email: '', mensaje: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-24 px-4 bg-[#FFF2E0]/10">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-elegant text-5xl font-light text-gray-900 mb-6">
          Contáctanos
        </h2>
        
        <div className="w-16 h-px bg-[#FFF2E0] mx-auto mb-8"></div>
        
        <p className="text-lg text-gray-600 mb-12 font-light">
          ¿Tienes alguna pregunta? Nos encantaría escucharte
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre"
                required
                className="w-full px-6 py-4 bg-white border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors font-light"
              />
            </div>
            
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="w-full px-6 py-4 bg-white border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors font-light"
              />
            </div>
          </div>

          <div>
            <textarea
              name="mensaje"
              value={formData.mensaje}
              onChange={handleChange}
              placeholder="Mensaje"
              required
              rows="6"
              className="w-full px-6 py-4 bg-white border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors font-light resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            className="px-12 py-4 bg-gray-900 text-white font-light tracking-widest uppercase text-sm hover:bg-gray-800 transition-all duration-300 hover:scale-105"
          >
            Enviar Mensaje
          </button>
        </form>

        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
          <div>
            <svg 
              className="w-8 h-8 mx-auto mb-4 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
            <p className="text-sm text-gray-600 font-light">info@tamaravalencia.com</p>
          </div>

          <div>
            <svg 
              className="w-8 h-8 mx-auto mb-4 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              ></path>
            </svg>
            <p className="text-sm text-gray-600 font-light">+593 99 999 9999</p>
          </div>

          <div>
            <svg 
              className="w-8 h-8 mx-auto mb-4 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              ></path>
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
            <p className="text-sm text-gray-600 font-light">Quito, Ecuador</p>
          </div>
        </div>
      </div>
    </section>
  );
}