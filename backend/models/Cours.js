const fs = require('fs');
const path = require('path');

class Cours {
    static async create({ file, classeId }) {
        try {
            const data = JSON.parse(fs.readFileSync('db.json'));
            
            // Stockez uniquement le chemin relatif à partir du dossier uploads
            const relativePath = file.path.replace('uploads/', '');
            
            const newCours = {
                id: Date.now().toString(),
                titre: file.originalname,
                classeId,
                filepath: relativePath,  // Chemin relatif sans 'uploads/'
                dateUpload: new Date().toISOString()
            };

            if (!data.cours) {
                data.cours = [];
            }
            
            data.cours.push(newCours);
            fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
            
            return newCours;
        } catch (error) {
            throw new Error(`Erreur lors de la création du cours: ${error.message}`);
        }
    }

    static async getByClasseId(classeId) {
        try {
            const data = JSON.parse(fs.readFileSync('db.json'));
            return data.cours ? data.cours.filter(cours => cours.classeId === classeId) : [];
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des cours: ${error.message}`);
        }
    }
}

module.exports = Cours;