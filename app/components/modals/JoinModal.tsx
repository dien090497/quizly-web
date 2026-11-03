'use client';

import { FormEvent, useState } from 'react';

type Props = {
  onJoin: (pin: string, name: string) => Promise<void>;
  onClose: () => void;
  onNotice: (msg: string) => void;
};

export default function JoinModal({ onJoin, onClose, onNotice }: Props) {
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await onJoin(pin.trim(), name);
      onClose();
    } catch {
      onNotice('Không vào được phòng. Kiểm tra mã PIN hoặc tên người chơi.');
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="create-modal join-modal" onSubmit={handleSubmit}>
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <span className="eyebrow">THAM GIA CÙNG BẠN BÈ</span>
        <h2>Nhập mã PIN <em>✳</em></h2>
        <p>Nhập mã 6 chữ số do host chia sẻ với bạn.</p>

        <label>Mã PIN
          <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" />
        </label>
        <label>Tên hiển thị
          <input required maxLength={24} value={name}
            onChange={e => setName(e.target.value)} placeholder="Tên của bạn" />
        </label>

        <button className="button button-dark submit-button" type="submit">
          Vào phòng <span>→</span>
        </button>
      </form>
    </div>
  );
}
