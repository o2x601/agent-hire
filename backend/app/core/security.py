from cryptography.fernet import Fernet
import os

_KEY = os.environ.get("ENCRYPTION_KEY", Fernet.generate_key().decode())
_fernet = Fernet(_KEY.encode() if isinstance(_KEY, str) else _KEY)


def encrypt_secret(plain: str) -> str:
    """APIキーなどの機密情報を暗号化して保存用文字列を返す"""
    return _fernet.encrypt(plain.encode()).decode()


def decrypt_secret(token: str) -> str:
    """暗号化された文字列を復号する"""
    return _fernet.decrypt(token.encode()).decode()
