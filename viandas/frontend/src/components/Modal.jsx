// src/components/Modal.jsx
import React from 'react';

// Añadimos la clase 'open' condicionalmente al overlay
const Modal = ({ isOpen, children, onClose }) => {
  // No renderizar nada si no está abierto (esto evita problemas con la animación inicial)
  if (!isOpen) return null;

  return (
    // Añade la clase 'open' si isOpen es true
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}> {/* Cierra al hacer clic fuera */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Evita que el clic dentro cierre */}
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;