// utils/fileUpload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Définir le dossier de destination en fonction du type de fichier
        const isExercice = req.path === '/';
        const isSoumission = req.path === '/soumettre';
        
        let uploadDir = 'uploads/documents/'; // par défaut
        
        if (isExercice) {
            uploadDir = 'uploads/exercices/';
        } else if (isSoumission) {
            uploadDir = 'uploads/soumissions/';
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non supporté'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: fileFilter
});

module.exports = upload;