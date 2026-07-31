import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useDataContext } from '../contexts/DataContext';
import { CATEGORIES } from '../data/categories';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const PAGE_SIZE = 10;

export default function ListView() {
  const { t } = useTranslation();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { data, addIngredient, editIngredient, deleteIngredient } = useDataContext();

  const category = CATEGORIES.find(c => c.id === categoryId);
  const ingredients = data[categoryId] || [];

  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setCurrentPage(1);
  }, [category.id, debouncedSearch]);

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
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="d-flex gap-2">
            <input
              className="form-control"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={t('list.newIngredient')}
            />
            <button className="btn btn-primary" onClick={handleSave} disabled={!text.trim()}>
              {t('list.save')}
            </button>
          </div>
        </div>
      </div>

      {ingredients.length === 0 ? (
        <p className="text-muted">{t('list.noIngredients')}</p>
      ) : (
        <div className="card">
          <div className="card-body">
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
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '80px' }}>{t('list.hash')}</th>
                      <th>{t('list.ingredient')}</th>
                      <th style={{ width: '80px' }}></th>
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
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setDeleteTarget({ id: item.id, text: item.text });
                              setShowDeleteModal(true);
                            }}
                          >
                            &times;
                          </button>
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
          </div>
        </div>
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
