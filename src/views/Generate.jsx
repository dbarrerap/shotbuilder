import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useDataContext } from '../contexts/DataContext';
import { useApiKeysContext } from '../contexts/ApiKeysContext';
import { InferenceClient } from '@huggingface/inference';
import { CATEGORIES } from '../data/categories';
import { DEFAULT_PREVIEW_MODEL } from '../data/previewModels';

function friendlyError(err) {
  const msg = typeof err?.message === 'string' ? err.message : '';
  if (/No Inference Provider available/i.test(msg)) {
    return null;
  }
  const marker = 'got instead: ';
  const idx = msg.indexOf(marker);
  if (idx !== -1) {
    const raw = msg.slice(idx + marker.length).trim();
    try {
      const parsed = JSON.parse(raw);
      const detail = parsed?.detail;
      if (Array.isArray(detail) && detail.length > 0 && detail[0]?.msg) {
        return detail[0].msg;
      }
    } catch {
      return null;
    }
    return null;
  }
  return msg || null;
}

export default function Generate() {
  const { data, lastPicks, generatePrompt, confirmPromptUse, resetPrompt, hasEmptyCategory } = useDataContext();
  const { apiKeys, previewModel } = useApiKeysContext();
  const { t, i18n } = useTranslation();
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
        model: previewModel || DEFAULT_PREVIEW_MODEL,
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
        toast.error(friendlyError(err) || t('generate.modelUnavailable'));
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

  const pinnedCountFor = (c) => {
    if (pinnedIds[c.id] != null && data[c.id].some(i => i.id === pinnedIds[c.id])) return 1;
    return data[c.id].length;
  };

  const totalCombinations = CATEGORIES.reduce((acc, c) => acc * pinnedCountFor(c), 1);
  const formattedCompact = new Intl.NumberFormat(i18n.language, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(totalCombinations);
  const formattedFull = new Intl.NumberFormat(i18n.language).format(totalCombinations);
  const formula = CATEGORIES.map(c =>
    `${t(`cat.${c.id}`)} ${pinnedCountFor(c)}`
  ).join(' × ');

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

      {totalCombinations > 0 && (
        <div className="card mb-3">
          <div className="card-body text-center">
            <h5 className="card-title text-body-secondary fw-normal mb-2">
              {t('generate.creativePotential')}
            </h5>
            <div className="display-6 fw-bold text-primary mb-2" title={formattedFull}>
              {formattedCompact}
            </div>
            <code className="text-body-secondary">{formula}</code>
            <p className="text-body-secondary mb-0 mt-2">
              {t('generate.unlimitedIdeas')}
            </p>
          </div>
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

      <div className="row g-2 generate-actions">
        <div className="col-6 col-md">
          <button
            className="btn btn-primary btn-lg btn-cta w-100"
            onClick={handleGenerate}
            disabled={hasEmptyCategory}
          >
            {t('generate.generate')}
          </button>
        </div>
        <div className="col-6 col-md">
          <button
            className="btn btn-outline-info btn-lg w-100"
            onClick={openPreviewModal}
            disabled={!lastPicks.length || previewState === 'loading'}
          >
            {previewState === 'loading' ? (
              <><span className="spinner-border spinner-border-sm me-1" /> {t('generate.loading')}</>
            ) : (
              t('generate.preview')
            )}
          </button>
        </div>
        <div className="col-6 col-md">
          <button
            className="btn btn-amber btn-lg w-100"
            onClick={handleCopy}
            disabled={!lastPicks.length}
          >
            {t('generate.copy')}
          </button>
        </div>
        <div className="col-6 col-md">
          <button
            className="btn btn-outline-secondary btn-lg w-100"
            onClick={handleReset}
            disabled={!lastPicks.length && !Object.keys(pinnedIds).length}
          >
            {t('generate.reset')}
          </button>
        </div>
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
