import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generatePrescription } from '../utils/ai';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';

export default function Prescription() {
  const { plotId, readingId } = useParams(); const [plan, setPlan] = useState(null);
  const { t } = useTranslation();
  useEffect(() => { (async () => { const [plotDoc, readingDoc] = await Promise.all([getDoc(doc(db, 'plots', plotId)), getDoc(doc(db, 'readings', readingId))]); if (plotDoc.exists()) setPlan((await generatePrescription(plotDoc.data(), readingDoc.exists() ? readingDoc.data() : null)).raw_data); })().catch(console.error); }, [plotId, readingId]);
  if (!plan) return <div className="container">{t('Preparing deterministic advisory')}</div>;
  return <div className="container" style={{ paddingBottom: 80, maxWidth: 850 }}>
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
      <LanguageToggle />
    </div>
    <h1 className="text-gradient">{t('Ragi action plan')}</h1><p>{plan.soilSpecific ? t('Verified Karnataka guidance') : t('Regional baseline not specific')}</p>
    <div className="card" style={{ borderLeft: '4px solid var(--brand-primary)', marginBottom: 18 }}><strong>{t('Rule set')}: {plan.ruleSetVersion}</strong><br />{plan.warnings.map((warning) => <p key={warning} style={{ margin: '8px 0', color: 'var(--text-muted)' }}>{warning}</p>)}</div>
    <h2>{t('Nutrient requirement')}</h2><div className="card"><b>N {plan.nutrientsKgHa.n} kg/ha · P₂O₅ {plan.nutrientsKgHa.p2o5} kg/ha · K₂O {plan.nutrientsKgHa.k2o} kg/ha</b><p>For {plan.areaAcres} acres ({plan.hectares} ha)</p></div>
    <h2>{t('What to use')}</h2>{plan.products.map((product) => <div className="card" key={product.id} style={{ marginBottom: 12 }}><h3>{product.name}</h3><p><b>{t('How much')}:</b> {product.kgPerAcre} kg/acre · {product.kgPerHa} kg/ha · {product.totalKg} kg total ({product.bags50kg} × 50 kg bags)</p><p><b>{t('When how')}:</b> {product.timing}</p><p><b>{t('Estimated cost')}:</b> {product.estimatedCost === null ? t('Enter local price') : `₹${product.estimatedCost.toLocaleString('en-IN')}`}</p></div>)}
    {plan.amendments.length > 0 && <><h2>{t('Manure and amendments')}</h2><div className="card">{plan.amendments.map((item) => <p key={item}>{item}</p>)}</div></>}
    <h2>{t('Crop stage plan')}</h2>{plan.tasks.map((task) => <div className="card" key={task.title} style={{ marginBottom: 10 }}><b>{task.days[0]}–{task.days[1]} DAS: {task.title}</b>{task.dueDate && <span> · from {task.dueDate}</span>}<p>{task.instruction}</p></div>)}
    <h2>{t('Crop protection prevention first')}</h2><div className="card">{plan.cropProtection.map((item) => <p key={item}>{item}</p>)}<p><b>{t('No automatic pesticide spray')}</b></p></div>
    <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>{t('Done')}</Link>
  </div>;
}
