import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useDataContext } from '../contexts/DataContext';
import { CATEGORIES } from '../data/categories';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { parseCsv, toCsv } from '../lib/csv';
import ActionCard from '../components/ActionCard';

const PAGE_SIZE = 10;

export default function ListView() {
  const { t } = useTranslation();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { data, addIngredient, addIngredients, deleteIngredients, editIngredient, deleteIngredient } = useDataContext();

  const category = CATEGORIES.find(c => c.id === categoryId);
  const ingredients = data[categoryId] || [];

  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [csvModal, setCsvModal] = useState(null);
  const csvInputRef = useRef(null);

  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
    setText('');
    setSearch('');
    setEditingId(null);
    setEditValue('');
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setCsvModal(null);
  }, [categoryId]);

  if (!category) return null;

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const promise = addIngredient(categoryId, trimmed).then(() => {
      setText('');
      setCurrentPage(1);
    });
    toast.promise(promise, {
      loading: t('list.saving'),
      success: t('list.saved'),
      error: t('list.error'),
    });
  };

  const startEditing = (id, currentText) => {
    setEditingId(id);
    setEditValue(currentText);
  };

  const handleEditConfirm = () => {
    const trimmed = editValue.trim();
    if (!trimmed || editingId === null) return;
    const promise = editIngredient(categoryId, editingId, trimmed).then(() => {
      setEditingId(null);
      setEditValue('');
    });
    toast.promise(promise, {
      loading: t('list.updating'),
      success: t('list.updated'),
      error: t('list.error'),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const confirmDelete = () => {
    if (deleteTarget === null) return;
    const { id } = deleteTarget;
    const promise = deleteIngredient(categoryId, id).then(() => {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    });
    toast.promise(promise, {
      loading: t('list.deleting'),
      success: t('list.deleted'),
      error: t('list.error'),
    });
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleCsvChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const rows = parseCsv(raw);
      if (rows.length === 0) {
        toast.error(t('list.csvEmpty'));
      } else {
        setCsvModal({ fileName: file.name, rows, skipFirst: false });
      }
    } catch {
      toast.error(t('list.error'));
    } finally {
      e.target.value = '';
    }
  };

  const confirmCsvImport = () => {
    if (!csvModal) return;
    const rows = csvModal.skipFirst ? csvModal.rows.slice(1) : csvModal.rows;
    if (rows.length === 0) {
      toast.error(t('list.csvEmpty'));
      return;
    }
    const run = async () => {
      const id = toast.loading(t('list.importing'));
      try {
        const added = await addIngredients(categoryId, rows);
        setCsvModal(null);
        setCurrentPage(1);
        toast.dismiss(id);
        toast.success(t('list.csvImported', { count: added.length }), {
          action: {
            label: t('list.undo'),
            onClick: () => {
              deleteIngredients(categoryId, added.map(item => item.id));
              setCurrentPage(1);
              toast.success(t('list.undoDone'));
            },
          },
        });
      } catch {
        toast.dismiss(id);
        toast.error(t('list.error'));
      }
    };
    run();
  };

  const handleDownloadSample = () => {
    const csv = toCsv(['a knight', 'a pirate', 'a wizard']);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csv = toCsv(ingredients.map(item => item.text));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('list.csvExported'));
  };

  const q = debouncedSearch.trim().toLowerCase();
  const filtered = ingredients.filter(item => item.text.toLowerCase().includes(q));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, filtered.length);
  const pageItems = filtered.slice(start, end);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div>
      <ActionCard
        title={t('list.addCategory', { category: t(`cat.${category.id}`) })}
        actions={[
          {
            key: 'import-csv',
            label: t('list.importCsv'),
            icon: 'fa-file-csv',
            variant: 'btn-primary',
            onClick: () => csvInputRef.current?.click(),
          },
          {
            key: 'export-csv',
            label: t('list.exportCsv'),
            icon: 'fa-download',
            variant: 'btn-outline-secondary',
            disabled: ingredients.length === 0,
            onClick: handleExportCsv,
          },
          {
            key: 'save',
            label: t('list.save'),
            variant: 'btn-amber',
            disabled: !text.trim(),
            onClick: handleSave,
          },
        ]}
      >
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleCsvChange}
          className="d-none"
        />
        <textarea
          className="form-control"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder={t('list.newIngredient')}
        />
      </ActionCard>

      {ingredients.length === 0 ? (
        <p className="text-muted">{t('list.noIngredients')}</p>
      ) : (
        <ActionCard title={t('nav.ingredients')}>
          <div className="position-relative mb-3">
              <input
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('list.search')}
                style={{ paddingRight: '2rem' }}
              />
              {search !== debouncedSearch && (
                <span className="position-absolute top-50 end-0 translate-middle-y me-2 text-primary" aria-hidden="true">
                  <i className="fa-solid fa-spinner fa-spin" />
                </span>
              )}
            </div>
            {filtered.length === 0 ? (
              <p className="text-muted mb-0">{t('list.noMatches')}</p>
            ) : (
              <>
                <table className="table table-hover align-middle mb-2">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>{t('list.hash')}</th>
                      <th>{t('list.ingredient')}</th>
                      <th style={{ width: '90px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item) => (
                      <tr key={item.id}>
                        <td className="text-body-secondary">{item.id}</td>
                        <td>
                          {editingId === item.id ? (
                            <div className="input-group input-group-sm">
                              <input
                                className="form-control form-control-sm"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditConfirm();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <button className="btn btn-primary" onClick={handleEditConfirm}>
                                {t('list.save')}
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{ cursor: 'pointer' }}
                              title={t('list.doubleClick')}
                              onDoubleClick={() => startEditing(item.id, item.text)}
                            >
                              {item.text}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              title={t('list.sendToGenerate')}
                              onClick={() => navigate('/generate', { state: { pin: { [category.id]: item.id } } })}
                            >
                              <i className="fa-solid fa-wand-magic-sparkles" />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                setDeleteTarget({ id: item.id, text: item.text });
                                setShowDeleteModal(true);
                              }}
                            >
                              &times;
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="d-flex justify-content-between align-items-center mb-0">
                  <small className="text-body-secondary">
                    {t('list.showing', { start: start + 1, end, total: filtered.length })}
                  </small>
                  {totalPages > 1 && (
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                            {t('list.prev')}
                          </button>
                        </li>
                        {pageNumbers.map(n => (
                          <li key={n} className={`page-item ${n === currentPage ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(n)}>
                              {n}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                            {t('list.next')}
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </div>
              </>
            )}
        </ActionCard>
      )}

      {csvModal && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setCsvModal(null)} />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('list.importCsv')}</h5>
                  <button type="button" className="btn-close" onClick={() => setCsvModal(null)} />
                </div>
                <div className="modal-body">
                  <p className="mb-2">
                    {t('list.importCsvBody', { count: csvModal.rows.length, file: csvModal.fileName })}
                  </p>
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="csv-skip-header"
                      checked={csvModal.skipFirst}
                      onChange={(e) => setCsvModal(prev => ({ ...prev, skipFirst: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="csv-skip-header">
                      {t('list.csvSkipHeader')}
                    </label>
                  </div>
                  <small className="text-body-secondary">{t('list.csvPreview')}</small>
                  <pre className="bg-light border rounded p-2 mb-2" style={{ maxHeight: 120, overflow: 'auto', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                    {(csvModal.skipFirst ? csvModal.rows.slice(1) : csvModal.rows).slice(0, 5).join('\n')}
                    {(csvModal.skipFirst ? csvModal.rows.slice(1) : csvModal.rows).length > 5 &&
                      `\n${t('list.csvMore', { count: (csvModal.skipFirst ? csvModal.rows.slice(1) : csvModal.rows).length - 5 })}`}
                  </pre>
                  <button className="btn btn-link btn-sm p-0" onClick={handleDownloadSample}>
                    <i className="fa-solid fa-download me-1"></i>
                    {t('list.csvSample')}
                  </button>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setCsvModal(null)}>
                    {t('list.cancel')}
                  </button>
                  <button className="btn btn-primary" onClick={confirmCsvImport}>
                    {t('list.import')} ({csvModal.skipFirst ? csvModal.rows.length - 1 : csvModal.rows.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('list.confirmDelete')}</h5>
                  <button type="button" className="btn-close" onClick={cancelDelete} />
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    {t('list.confirmDeleteBody', { text: deleteTarget?.text })}
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={cancelDelete}>
                    {t('list.cancel')}
                  </button>
                  <button className="btn btn-danger" onClick={confirmDelete}>
                    {t('list.delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
