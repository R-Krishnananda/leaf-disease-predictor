from datetime import datetime
from mongoengine import Document, StringField, ListField, DictField, DateTimeField

class Chat(Document):
    user_email = StringField(required=True)
    disease_title = StringField(required=True)
    messages = ListField(DictField())
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'indexes': [
            'user_email',
            'disease_title',
            ('user_email', 'disease_title')
        ]
    }
