import React from 'react';

export default function DataTable({ columns, data, onRowClick, title, actions }) {
  return (
    <div className="table-container">
      {(title || actions) && (
        <div className="table-header-bar">
          {title && <h3>{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} style={col.style}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={col.style}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
