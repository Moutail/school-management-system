// src/components/ClasseTable.jsx
import PropTypes from 'prop-types';

function ClasseTable({ classes, onAssign, selectedClasse }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2">Nom de la classe</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((classe) => (
            <tr key={classe.id}>
              <td className="border px-4 py-2">{classe.nom}</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => onAssign(classe.id)}
                  className={`px-4 py-2 rounded ${
                    selectedClasse === classe.id
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {selectedClasse === classe.id ? 'Assigné' : 'Assigner'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

ClasseTable.propTypes = {
  classes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nom: PropTypes.string.isRequired
    })
  ).isRequired,
  onAssign: PropTypes.func.isRequired,
  selectedClasse: PropTypes.string
};

export default ClasseTable;