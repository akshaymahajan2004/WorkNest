import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="450px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{
          backgroundColor: variant === 'danger' ? 'var(--danger-50)' : 'var(--primary-50)',
          color: variant === 'danger' ? 'var(--danger-600)' : 'var(--primary-600)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-full)',
          flexShrink: 0
        }}>
          <AlertTriangle size={24} />
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: '1.5' }}>
          {message}
        </div>
      </div>
    </Modal>
  );
};
