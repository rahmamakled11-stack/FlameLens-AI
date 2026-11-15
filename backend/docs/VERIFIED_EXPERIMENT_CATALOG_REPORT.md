# Verified NASA Experiment Catalog Report

## Scope and method

This report covers the eight requested combustion investigation candidates. Record identity was checked against NASA's Combustion Science archive. Candidate-specific objectives, results, publications, and media were added only when an inspected NASA source supported them. NTRS citation numbers and NASA media asset IDs identify documents or media; they are not treated as NASA investigation identifiers.

The archive verifies the listed names and project descriptions. No candidate name remains unverified, but several project/run details need manual review before import. NASA PSI's accessible page was an application shell in this review, so it was not used as evidence for record fields. The inspected NTRS pages and public NASA media assets were accessible. No access restriction was bypassed.

## Candidate verification

| Candidate | Official NASA title | Verification | Available evidence | Missing or qualified information |
|---|---|---|---|---|
| ACME | Advanced Combustion via Microgravity Experiments (ACME) | Verified in NASA archive; NTRS confirms six ISS investigations in the Combustion Integrated Rack, Nov. 2017–Feb. 2022. | NASA objectives, ISS/CIR context, two NTRS posters, and one NASA image asset. | No experiment-level NASA identifier or DOI found. Findings should be imported from the original publications only after a science review. |
| BASS | Burning and Suppression of Solids (BASS) | Verified in NASA archive; NASA NTRS and NASA media document the BASS-II phase. | Investigation objective, BASS-II publications/results report, and one NASA image. | Preserve BASS versus BASS-II distinction; no experiment-level NASA identifier or DOI found. |
| DAFT | Dust and Aerosol Measurement Feasibility Test (DAFT) | Verified in NASA archive and NTRS. | P-Trak feasibility purpose, NASA presentation discussing the precursor and cabin background measurement, and related publication records. | DAFT is a precursor supporting SAME, not SAME itself. No validated media asset or experiment-level NASA identifier found. |
| FLEX | Flame Extinguishment Experiment (FLEX) | Verified in NASA archive and NTRS. | Objective and detailed results publication covering March 2009–December 2011. | The inspected searches did not yield a verified media item. No experiment-level NASA identifier or DOI found. |
| Saffire | Spacecraft Fire Safety Demonstration (Saffire) | Verified in NASA archive; NTRS and NASA media verify named Saffire installments. | Series description, Saffire-I–III operational/development publication, Saffire-V results video, and Saffire-VI preliminary-results paper. | Keep individual Saffire installment records distinct if importing results or media. No experiment-level NASA identifier or DOI found. |
| SAME | Smoke Aerosol Measurement Experiment (SAME) | Verified in NASA archive and NASA's ISS article. | Smoke/aerosol detection objective, SAME-2 particle morphology/size paper, one NASA ISS image, and a NASA article. | SAME and SAME-2 are different run scopes. NASA's article dates the repeat to 2011; the NTRS SAME-2 record associates the results with Expedition 24. Reconcile the run chronology and record scope manually; do not treat the paper's conference date as the experiment date. |
| SLICE | Structure & Liftoff in Combustion Experiment (SLICE) | Verified in NASA archive and a NASA article; NTRS confirms related experimental/computational research. | Coflow flame research description, NTRS publication, and one image embedded in the NASA SLICE article. | The inspected NTRS paper covers a study under both microgravity and normal gravity; do not attribute every paper result exclusively to an ISS run. No experiment-level NASA identifier or DOI found. |
| SPICE | Smoke Point in Co-flow Experiment (SPICE) | Name and planned objectives verified in NASA archive and NTRS. | Planned flame and smoke-point measurement objectives and an NTRS record. | The NTRS description is prospective. Completion, flight status, results, and mission are not established by the inspected sources. No experiment-level NASA identifier or DOI found. |

### Unverified candidates

None of the eight names remains unverified as a NASA combustion project: all eight are listed in NASA's Combustion Science archive. This is not equivalent to verifying every mission, flight, completion status, installment, data release, or numeric result. Manual verification remains necessary for the qualified details above, particularly SPICE status and SAME run chronology.

## Sources inspected

Primary project index:

- [NASA Combustion Science archive](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/) — lists the archived investigations and their project descriptions.

NASA NTRS records inspected:

- [20210015913 — ACME on the ISS](https://ntrs.nasa.gov/citations/20210015913)
- [20220015583 — ACME poster](https://ntrs.nasa.gov/citations/20220015583)
- [20160000593 — BASS-II results presentation](https://ntrs.nasa.gov/citations/20160000593)
- [20210011385 — BASS-II Summary Report](https://ntrs.nasa.gov/citations/20210011385)
- [20050215648 — DAFT hardware feasibility article](https://ntrs.nasa.gov/citations/20050215648)
- [20070031686 — particle and smoke detection presentation](https://ntrs.nasa.gov/citations/20070031686)
- [20150023456 — FLEX detailed results](https://ntrs.nasa.gov/citations/20150023456)
- [20170000230 — Saffire operations and development](https://ntrs.nasa.gov/citations/20170000230)
- [20240002981 — Saffire VI preliminary results](https://ntrs.nasa.gov/citations/20240002981)
- [20130000422 — SAME-2 particle morphology and size results](https://ntrs.nasa.gov/citations/20130000422)
- [20140017780 — coflow soot-formation study related to SLICE](https://ntrs.nasa.gov/citations/20140017780)
- [20090014827 — SPICE objectives and description](https://ntrs.nasa.gov/citations/20090014827)

Other NASA pages and assets inspected:

- [Saffire-V NASA media metadata](https://images-assets.nasa.gov/video/GRC-2021-CN-00008/metadata.json) and its [asset collection](https://images-assets.nasa.gov/video/GRC-2021-CN-00008/collection.json).
- [ACME image metadata](https://images-assets.nasa.gov/image/GRC-2016-C-05051/metadata.json).
- [BASS-II image metadata](https://images-assets.nasa.gov/image/iss040e086481/metadata.json).
- [SAME image metadata](https://images-assets.nasa.gov/image/iss024e008351/metadata.json).
- [NASA SAME article](https://www.nasa.gov/wp-json/wp/v2/migration/309159) and [NASA SLICE article](https://www.nasa.gov/wp-json/wp/v2/migration/309165).
- NASA Images API searches were made for candidate media. A zero-hit query is recorded only as “no validated result from this query,” not proof that NASA has no media for the experiment.

## Manifest contents

[verified_nasa_experiments.json](./verified_nasa_experiments.json) contains eight project records. Each record includes the requested title, acronym, nullable NASA identifier, program, mission, summary, description, NASA URL, sections, publications, media, and source references.

- `nasa_identifier` is `null` for all candidates. NTRS document IDs and NASA media IDs were not substituted.
- All section, publication, and media entries carry their supporting `source_url`.
- DOI, journal, abstract, and dates are null where they were not explicitly verified.
- No scalar experiment metrics or fabricated measurements are included.
- Media is included only for ACME, BASS-II, Saffire-V, SAME, and SLICE based on directly inspected NASA metadata or an inspected NASA article. Empty media arrays mean no asset was validated for that record in this review, not that none exists.

## Existing-schema mapping and import readiness

The schema and required/nullability rules below are taken from [BACKEND_DATABASE_ARCHITECTURE.md](./BACKEND_DATABASE_ARCHITECTURE.md).

| Manifest value | Destination | Import assessment |
|---|---|---|
| `title`, `acronym`, `program`, `mission`, `summary`, `description`, `nasa_url` | `experiments` | Fits existing columns. Only `title` is required; nullable fields may remain null. |
| `nasa_identifier` | `experiments.nasa_identifier` | Null for all eight; do not synthesize identifiers from NTRS document IDs or media IDs. |
| `sources[]` | `sources` | Fits required title, source type, and source URL. Associate records with the experiment; leave `publication_date` null unless verified. |
| `sections[]` | `experiment_sections` | Fits required `section_type` and title, nullable content, and optional `source_id`. Resolve `source_url` to a source row before assigning `source_id`. |
| `publications[]` | `publications` | Fits required experiment and title, nullable authors/type/journal/DOI/URL/date/abstract. The NTRS page is retained as `publication_url`; the table has no source foreign key. |
| `media[]` | `media` | Fits required title, type, and URL plus optional description, thumbnail, and `source_id`. Resolve `source_url` to the corresponding source row before assigning `source_id`. |
| Scientific metrics | `experiment_metrics` | No verified scalar measurements are in this manifest. Import no metric rows. Preserve original units and conditions if vetted measurements are added later. |

**Readiness:** the verified descriptive data fits the existing models without a schema change. It is **not ready for unattended/repeatable import**:

1. `experiments.nasa_identifier` is the only unique external identity column, and it is null for all candidates. `title` and `acronym` are not unique. A safe importer needs a reviewed stable identity key and conflict policy before it can upsert these records idempotently.
2. The manifest's section/media `source_url` values must be resolved to inserted `sources` rows to preserve provenance. The publications table has no source foreign key, so publication provenance must remain in `publication_url` and associated source records.
3. Keep BASS-II, SAME-2, and individual Saffire installments traceable; the current schema has no explicit parent/variant relationship.
4. Do not treat NASA NTRS record identifiers as experiment identifiers or infer missing NASA IDs, DOI values, or mission status.
5. NTRS and NASA media pages expose records in varied forms. Check each record's distribution/rights and any restricted legacy project-data access before downloading or importing files. Do not bypass access restrictions.

## Remaining manual checks

- Confirm an authoritative NASA investigation identifier, if one exists, for each candidate.
- Reconcile SAME/SAME-2 event dates and determine whether the catalog should represent the program, each run, or both.
- Verify whether SPICE progressed from the plans described by NASA to a completed experiment, and locate any primary results if they exist.
- Review publication-level conclusions and any scientific measurements before converting them into experiment sections or metrics.
- Confirm copyright/distribution terms for every document or media asset selected for production display or local storage.
