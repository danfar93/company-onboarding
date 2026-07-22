import { Router, Request, Response } from 'express';

import type { EnrichRequest, EnrichResponse } from '../enrichment/types';
import { enrichCompany } from '../enrichment/orchestrator';

const router = Router();

router.post('/', async (req: Request<{}, {}, EnrichRequest>, res: Response) => {
  const { email, website } = req.body;

  if (!email || !website) {
    return res.status(400).json({ error: 'Email and website are required' });
  }

  try {
    const response = await enrichCompany(email, website);
    res.json(response);
  } catch (err) {
    // The pipeline degrades gracefully internally, so reaching here is
    // unexpected. Return a valid, empty contract with the error surfaced as a
    // warning rather than failing the request — the user can still onboard.
    const message = err instanceof Error ? err.message : 'Enrichment failed';
    const response: EnrichResponse = {
      company: {},
      enrichment: { sources: [], confidence: {}, fieldSources: {}, warnings: [message] },
    };
    res.status(200).json(response);
  }
});

export { router as enrichRouter };
