import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useDataContext } from '../contexts/DataContext';
import { useApiKeysContext } from '../contexts/ApiKeysContext';
import { InferenceClient } from '@huggingface/inference';
import { CATEGORIES } from '../data/categories';

export default function Generate() {
  const { lastPicks, generatePrompt, confirmPromptUse, resetPrompt, hasEmptyCategory } = useDataContext();
  const { apiKeys } = useApiKeysContext();
  const { t } = useTranslation();
  const location = useLocation();
  const [pinnedIds, setPinnedIds] = useState({});
  const [previewState, setPreviewState] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const prevKeyRef = useRef(null);
  const pendingKeyRef = useRef(null);
  const ignoreResultRef = useRef(false);

  useEffect(() => {
    const pin = location.state?.pin;
    if (pin) {
      setPinnedIds(pin);
      generatePrompt(pin);
    }
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (prevKeyRef.current) {
        URL.revokeObjectURL(prevKeyRef.current);
      }
    };
  }, []);

  const togglePin = (catId, ingredientId) => {
    setPinnedIds(prev => {
      if (prev[catId] === ingredientId) {
        const next = { ...prev };
        delete next[catId];
        return next;
      }
      return { ...prev, [catId]: ingredientId };
    });
  };

  const handleGenerate = () => {
    setPreviewState(null);
    generatePrompt(pinnedIds);
  };

  const handleCopy = async () => {
    if (!lastPicks.length) return;
    try {
      await navigator.clipboard.writeText(promptText);
    } catch {
      toast.error(t('generate.failedToCopy'));
      return;
    }
    await toast.promise(confirmPromptUse(), {
      loading: t('generate.registeringUsage'),
      success: t('generate.copiedAndRegistered'),
      error: t('settings.error'),
    });
  };

  const openPreviewModal = () => {
    if (!lastPicks.length) return;
    const key = apiKeys?.huggingface;
    if (!key) {
      toast.error(t('generate.noApiKey'));
      return;
    }
    setShowPreviewModal(true);
  };

  const handlePreview = async () => {
    setShowPreviewModal(false);
    if (!lastPicks.length) return;
    const key = apiKeys?.huggingface;
    if (!key) {
      toast.error(t('generate.noApiKey'));
      return;
    }

    if (pendingKeyRef.current) return;

    setPreviewState('loading');
    pendingKeyRef.current = true;
    ignoreResultRef.current = false;

    try {
      const client = new InferenceClient(key);
      const blob = await client.textToImage({
        model: 'black-forest-labs/FLUX.1-schnell',
        inputs: promptText,
      });
      if (ignoreResultRef.current) {
        URL.revokeObjectURL(URL.createObjectURL(blob));
        return;
      }
      if (prevKeyRef.current) {
        URL.revokeObjectURL(prevKeyRef.current);
      }
      const url = URL.createObjectURL(blob);
      prevKeyRef.current = url;
      setPreviewState(url);
    } catch (err) {
      if (!ignoreResultRef.current) {
        setPreviewState(null);
        toast.error(err.message || t('generate.failedToGenerate'));
      }
    } finally {
      pendingKeyRef.current = false;
    }
  };

  const handleReset = () => {
    if (prevKeyRef.current) {
      URL.revokeObjectURL(prevKeyRef.current);
      prevKeyRef.current = null;
    }
    ignoreResultRef.current = true;
    pendingKeyRef.current = false;
    setPreviewState(null);
    setPinnedIds({});
    resetPrompt();
  };

  const promptText = lastPicks.map(p => {
    const cat = CATEGORIES.find(c => c.id === p.cat);
    return `${cat ? t(`cat.${cat.id}`) : p.cat}: ${p.item.text}`;
  }).join('\n');

  return (
    <div>
      {hasEmptyCategory && (
        <div className="alert alert-warning mb-3 py-2">
          {t('generate.emptyCategory')}
        </div>
      )}

      {!apiKeys?.huggingface && (
        <div className="alert alert-info mb-3 py-2">
          <i className="fa-solid fa-key me-1"></i>
          <a href="/#/settings" className="alert-link">{t('generate.configureKey')}</a> {t('generate.toUsePreview')}
        </div>
      )}

      <div className="card">
        <div className="card-body">
      <div className="mb-3">
        <label className="form-label fw-medium mb-1">{t('generate.promptId')} <small className="text-muted fw-normal">{t('generate.clickToPin')}</small></label>
        <div className="d-flex flex-wrap gap-2">
          {lastPicks.length > 0 ? (
            lastPicks.map(pick => {
              const cat = CATEGORIES.find(c => c.id === pick.cat);
              const isPinned = pinnedIds[pick.cat] === pick.item.id;
              return (
                <button
                  key={pick.cat}
                  className={`btn btn-sm ${isPinned ? 'btn-amber' : 'btn-outline-secondary'}`}
                  onClick={() => togglePin(pick.cat, pick.item.id)}
                >
                  {cat ? t(`cat.${cat.id}`) : pick.cat}: {pick.item.id}
                </button>
              );
            })
          ) : (
            <span className="text-body-secondary">{t('generate.generateToCreate')}</span>
          )}
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label fw-medium">{t('generate.generatedPrompt')}</label>
        <textarea
          className="form-control generated-textarea"
          rows={10}
          readOnly
          value={lastPicks.length > 0 ? promptText : ''}
          placeholder={t('generate.placeholder')}
          onClick={(e) => e.target.select()}
        />
      </div>

      <div className="d-flex gap-2">
        <button
          className="btn btn-primary btn-lg btn-cta flex-fill"
          onClick={handleGenerate}
          disabled={hasEmptyCategory}
        >
          {t('generate.generate')}
        </button>
        <button
          className="btn btn-outline-info btn-lg"
          onClick={openPreviewModal}
          disabled={!lastPicks.length || previewState === 'loading'}
        >
          {previewState === 'loading' ? (
            <><span className="spinner-border spinner-border-sm me-1" /> {t('generate.loading')}</>
          ) : (
            t('generate.preview')
          )}
        </button>
        <button
          className="btn btn-amber btn-lg"
          onClick={handleCopy}
          disabled={!lastPicks.length}
        >
          {t('generate.copy')}
        </button>
        <button
          className="btn btn-outline-secondary btn-lg"
          onClick={handleReset}
          disabled={!lastPicks.length && !Object.keys(pinnedIds).length}
        >
          {t('generate.reset')}
        </button>
      </div>
        </div>
      </div>

      {previewState && previewState !== 'loading' && (
        <div className="mt-3">
          <div className="card">
            <div className="card-body text-center">
              <img src={previewState} alt={t('generate.generatedPreview')} className="img-fluid rounded" style={{ maxHeight: 512 }} />
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setShowPreviewModal(false)} />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('generate.confirmPreviewTitle')}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowPreviewModal(false)} />
                </div>
                <div className="modal-body">
                  <p className="mb-0">{t('generate.confirmPreviewBody')}</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowPreviewModal(false)}>
                    {t('generate.cancel')}
                  </button>
                  <button className="btn btn-primary" onClick={handlePreview}>
                    {t('generate.confirm')}
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
