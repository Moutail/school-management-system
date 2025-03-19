// models/Professeur.js
const fs = require('fs');
const path = require('path');

class Professeur {
  static getAll() {
    const data = JSON.parse(fs.readFileSync('db.json'));
    return data.professeurs || [];
  }

  static assignerClasse(professeurId, classeId) {
    const data = JSON.parse(fs.readFileSync('db.json'));
    const professeur = data.professeurs.find(p => p.id === professeurId);
    if (professeur) {
      professeur.classeId = classeId;
      fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
      return true;
    }
    return false;
  }
}

module.exports = Professeur;