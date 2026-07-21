import { Router, Request, Response } from 'express';

import type { EnrichRequest, EnrichResponse } from '../enrichment/types';

const router = Router();

router.post('/', async (req: Request<{}, {}, EnrichRequest>, res: Response) => {
  const { email, website } = req.body;

  if (!email || !website) {
    return res.status(400).json({ error: 'Email and website are required' });
  }

  // TODO (next): run the enrichment pipeline here —
  //   normalise input -> run sources concurrently -> merge with per-field
  //   provenance -> return. For now we return an empty-but-valid contract so
  //   the mobile flow works end-to-end against the real response shape.
  const response: EnrichResponse = {
    company: {},
    enrichment: {
      sources: [],
      confidence: {},
      fieldSources: {},
      warnings: [],
    },
  };

  res.json(response);
});

export { router as enrichRouter };
