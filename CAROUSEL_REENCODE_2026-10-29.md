# Carousel re-encode and loading, 2026-10-29

The record behind the homepage carousel PR (`perf-homepage-carousel`): why every clip was re-encoded, how, what it did to size and brightness, and the custody table for the files now in `videos/`. The loading and motion rules themselves are documented in `SITE_GUIDE §13` ("Loading and motion"); the encode recipe for new slides is `NEW_PAGE_CHECKLIST §8` step 4.

## Why
Measured on production 2026-10-29 (project doc `claude/SPEED_A11Y_READ_2026-10-29.md`): on an iPhone-sized screen the homepage fetched and played a ~5 MB clip within 8 seconds although the carousel starts below the first screen, and auto-advance fetched the next clip about every 10 seconds while the page stayed open. Lighthouse put the homepage at 5,492 KB, 4,860 KB of it one clip. The 13 Featured clips averaged 4.3 MB. The committed masters ran 0.95 to 9.2 Mbps for the same 1280×720, 24 fps, ~10-second format, and two of them (`bitcoin-fixed-income.mp4`, `discount-or-premium.mp4`) still carried the audio track and mjpeg thumbnail that `NEW_PAGE_CHECKLIST §8` step 4 says to strip.

## Encode
```bash
ffmpeg -i <master>.mp4 -map 0:<main video stream> -an -sn -dn -map_metadata -1 \
  -c:v libx264 -preset veryfast -crf 24 -tune film -pix_fmt yuv420p \
  -movflags +faststart videos/<slug>.mp4
```
- Same resolution, frame rate and frame count (241 frames on every clip, checked). Colour tags carry over from the source (tagged clips stay `tv`/`bt709`; untagged stay untagged).
- **Why CRF 24 with `-tune film`, not CRF 26:** CRF 26 averaged 1.1 MB per Featured clip but turned the grain in smooth glows into visible blotches at 1:1 (the Migration doorway). CRF 24 film keeps them clean. A 2 Mbps cap was tried on the four largest clips and rejected: similarity fell to 0.93 on Horizon and Heatmap.
- **Poster per clip:** the first frame of the re-encoded file, WebP quality 72, 1280×720, converted with the BT.709 limited-range matrix the browser uses for the video, so the picture doesn't shift when the clip starts. `videos/posters/<slug>.webp`, 2.2 MB for all 49; a reader fetches two at a time (the active slide and the next).

## Results
- **Size:** 243.7 MB → 95.0 MB for the 49 clips (61% smaller). The 13 Featured clips: 56.1 MB → 21.3 MB (average 4.31 → 1.63 MB).
- **Brightness (the SITE_GUIDE §13 gate, per-frame `signalstats` YAVG as % of 255):** no frame moved more than 0.37 points on any clip; every floor, opening and closing value is within 0.3 points of the master. No clip's gate status changed.
- **Similarity:** SSIM 0.952–0.997 against the masters (lowest: The Melting Ice Cube 0.952, Heatmap 0.954, Your Deployment Plan 0.958). The three lowest were checked side by side at 1:1 and look alike.
- **Streams:** every file is one h264 stream, no audio, no thumbnail, `moov` at the front.

## Custody table (the committed files)
Values are bytes, then the gate's luma figures (master → re-encode, % of 255), the largest per-frame luma difference in points, SSIM against the master, and the poster's size. ¹ The master also carried an audio track and an mjpeg thumbnail, now gone.

| Clip | Before | After | SHA-1 of the committed file | Floor | Opening | Closing | Max frame Δ | SSIM | Poster |
|---|---:|---:|---|---|---|---|---:|---:|---:|
| `bitcoin-allocation-sizing.mp4` | 2,344,617 | 500,361 | `b71a5f19db5f0d2f845184aacc8fcc26dac20bd2` | 15.5 → 15.5 | 15.5 → 15.5 | 17.4 → 17.5 | 0.08 | 0.993 | 7 KB |
| `bitcoin-and-metcalfes-law.mp4` | 3,094,859 | 814,121 | `6c01a94f2c65a80002dadc8e91c54b33828400fb` | 48.6 → 48.7 | 48.7 → 48.8 | 48.6 → 48.7 | 0.16 | 0.984 | 43 KB |
| `bitcoin-as-collateral.mp4` | 6,287,639 | 1,540,297 | `5ad18df622f8d18be14e79beca7d0db2ebbb88b9` | 15.1 → 15.2 | 15.1 → 15.2 | 20.4 → 20.5 | 0.23 | 0.980 | 38 KB |
| `bitcoin-backed-mortgages.mp4` | 2,855,021 | 1,660,707 | `7f22856b10f09ffa8b1e5fc64ef83da8339f788c` | 30.3 → 30.4 | 31.4 → 31.4 | 30.3 → 30.4 | 0.18 | 0.962 | 90 KB |
| `bitcoin-defined.mp4` | 2,425,164 | 486,132 | `83315c6cea1f9523d81683fff43e30fda049ed17` | 13.5 → 13.6 | 14.1 → 14.1 | 13.6 → 13.7 | 0.12 | 0.983 | 36 KB |
| `bitcoin-escape-velocity.mp4` | 5,294,087 | 3,807,568 | `eba5393f1d592be3f64b355875f7811645586d50` | 51.6 → 51.6 | 51.6 → 51.6 | 52.9 → 52.9 | 0.08 | 0.980 | 50 KB |
| `bitcoin-fixed-income.mp4` ¹ | 11,825,644 | 3,427,446 | `30c86886a22bc7254afb81f79452a88856b36194` | 32.8 → 32.9 | 33.2 → 33.2 | 32.9 → 33.0 | 0.10 | 0.962 | 112 KB |
| `bitcoin-hash-rate.mp4` | 5,529,042 | 2,576,117 | `35b1bba253e181b4b958f98af1ac0b5a557a499e` | 26.2 → 26.2 | 26.2 → 26.2 | 34.6 → 34.7 | 0.22 | 0.979 | 42 KB |
| `bitcoin-in-gold.mp4` | 5,586,564 | 1,262,786 | `517c2f9120d332a4acc5918a5b7a8476d1bfd3e6` | 30.3 → 30.3 | 30.3 → 30.3 | 33.0 → 33.1 | 0.20 | 0.976 | 56 KB |
| `bitcoin-lenders.mp4` | 1,655,968 | 542,595 | `5d9697d74deb59d2980bc87994316eb7312a3abe` | 24.2 → 24.2 | 24.2 → 24.2 | 26.2 → 26.2 | 0.11 | 0.986 | 15 KB |
| `bitcoin-spikes.mp4` | 3,693,550 | 2,310,378 | `cf4a76b40fed0d93cada8a8cf0ee16d3e4a8cc5f` | 47.0 → 47.0 | 47.0 → 47.0 | 47.3 → 47.4 | 0.18 | 0.978 | 44 KB |
| `bitcoin-vs-paying-down-the-mortgage.mp4` | 2,556,320 | 1,312,616 | `f10f28612934f9bade2c7d977bad44a306d4e39c` | 51.4 → 51.4 | 51.4 → 51.4 | 53.2 → 53.3 | 0.19 | 0.981 | 55 KB |
| `borrowing.mp4` | 2,723,532 | 1,777,036 | `f118fa9a34b391a12d084c674eb189b1ea9b0c23` | 32.8 → 32.9 | 33.1 → 33.2 | 32.8 → 32.9 | 0.13 | 0.965 | 45 KB |
| `bubble.mp4` | 3,076,582 | 435,400 | `0a43d04ff0bee6e3bd4bcc417814b6980e0d5108` | 10.1 → 10.2 | 11.2 → 11.2 | 10.2 → 10.2 | 0.04 | 0.994 | 10 KB |
| `bull-and-bear-cycles.mp4` | 8,048,147 | 2,183,752 | `a7eae6f51d441a7ae8e0a93a99017df4cef46b60` | 20.0 → 20.1 | 20.0 → 20.1 | 22.0 → 22.1 | 0.11 | 0.976 | 17 KB |
| `candle-burn-out.mp4` | 1,607,589 | 248,171 | `cb9fa8213b9be7dc1bb8f98ad8e9153af9f6868a` | 7.5 → 7.6 | 9.9 → 9.9 | 7.6 → 7.6 | 0.10 | 0.997 | 6 KB |
| `compare-housing-plans.mp4` | 4,970,680 | 3,315,012 | `e585bd88dcd1f0daaa5c61625057557b330d4394` | 58.4 → 58.4 | 58.4 → 58.4 | 68.9 → 68.9 | 0.12 | 0.979 | 63 KB |
| `compare-retirement-plans.mp4` | 5,972,363 | 3,238,098 | `d6ba0dd6458d5f6cdcdbda19e252cacc77bd3167` | 50.6 → 50.6 | 50.6 → 50.6 | 55.0 → 55.1 | 0.17 | 0.971 | 90 KB |
| `disciplined-rebalancing.mp4` | 6,461,765 | 4,456,396 | `039bc0f91bf6cebc05504d20356305b3df34df36` | 37.3 → 37.3 | 37.5 → 37.5 | 37.4 → 37.4 | 0.11 | 0.965 | 62 KB |
| `discount-or-premium.mp4` ¹ | 9,864,243 | 2,137,359 | `bd545425d4beaa4202239f593af0d4c3048149d4` | 20.7 → 20.7 | 20.7 → 20.7 | 23.2 → 23.3 | 0.16 | 0.968 | 32 KB |
| `fixed-pie.mp4` | 2,628,284 | 482,381 | `295c3c5fbbd3698ebf07c1dfaf3eeed3e03e1dba` | 18.5 → 18.6 | 23.4 → 23.4 | 18.8 → 18.9 | 0.16 | 0.983 | 24 KB |
| `heatmap.mp4` | 7,137,910 | 4,540,228 | `f497902c518bc454d7e1158f688dec7ef14c24b2` | 38.9 → 39.0 | 39.0 → 39.0 | 39.3 → 39.6 | 0.26 | 0.954 | 107 KB |
| `horizon.mp4` | 8,742,641 | 6,077,283 | `5de3809f6e3005f96d5de26dffa66798bfce0264` | 43.8 → 43.8 | 43.8 → 43.8 | 44.3 → 44.4 | 0.09 | 0.964 | 79 KB |
| `how-much-bitcoin.mp4` | 3,328,712 | 872,004 | `3ea8f29005d31c68ba4c68f5606cb57ec3a670a6` | 13.6 → 13.6 | 13.6 → 13.6 | 14.4 → 14.5 | 0.10 | 0.988 | 16 KB |
| `living-on-bitcoin.mp4` | 2,930,551 | 1,834,403 | `07e39ff8939fa9f853340fe31e51cc1b823e5ac5` | 29.0 → 29.0 | 29.0 → 29.0 | 29.7 → 30.0 | 0.29 | 0.963 | 87 KB |
| `lump-sum-or-ladder-in.mp4` | 2,533,646 | 733,599 | `484c8b1084f870bb5ffafa8730c727b302d7e869` | 13.2 → 13.3 | 13.9 → 13.9 | 13.4 → 13.4 | 0.09 | 0.989 | 19 KB |
| `melting-ice-cube.mp4` | 10,532,513 | 1,444,180 | `a59e9df13b65dc0df05d64a33048a23ce1214d11` | 15.9 → 16.1 | 20.3 → 20.3 | 15.9 → 16.1 | 0.27 | 0.952 | 53 KB |
| `migration.mp4` | 6,288,749 | 539,874 | `2650acf28f89d76e78e731123efd3624c403d759` | 7.2 → 7.3 | 7.3 → 7.3 | 29.5 → 29.5 | 0.21 | 0.979 | 5 KB |
| `money-trees.mp4` | 8,584,126 | 2,448,820 | `29758f9dd7d1ec250e842655e93e89355bc6da7d` | 11.9 → 12.0 | 13.5 → 13.5 | 11.9 → 12.0 | 0.11 | 0.969 | 65 KB |
| `paper-bitcoin.mp4` | 1,192,384 | 225,763 | `25cddf3cbcccdbd0dbf3d47f528851607031c259` | 12.5 → 12.5 | 14.8 → 14.8 | 12.5 → 12.5 | 0.12 | 0.993 | 13 KB |
| `power-law.mp4` | 4,185,383 | 2,194,352 | `de54c5815b8fa760a03b63f57d0fc108572b0e16` | 34.2 → 34.2 | 34.2 → 34.2 | 43.0 → 43.1 | 0.21 | 0.972 | 61 KB |
| `real-estate.mp4` | 4,219,799 | 2,376,685 | `25a518b317232c7b75b51620a82669e34cabb867` | 39.5 → 39.5 | 39.5 → 39.5 | 51.3 → 51.4 | 0.23 | 0.972 | 26 KB |
| `rental-property.mp4` | 3,619,324 | 3,034,652 | `23f3af062d02365b1890ed4a300987177345b965` | 27.3 → 27.3 | 27.4 → 27.5 | 36.9 → 37.1 | 0.17 | 0.963 | 26 KB |
| `retirement.mp4` | 5,732,150 | 3,486,081 | `5b516eec6881756bd1b6a1961820e8cd2e6caee3` | 42.3 → 42.4 | 42.7 → 42.7 | 47.9 → 48.0 | 0.17 | 0.960 | 57 KB |
| `risks-to-bitcoin.mp4` | 4,907,329 | 3,080,016 | `de47ec69fd941fe0b386749df9d041c7dbf26851` | 36.4 → 36.4 | 36.4 → 36.4 | 39.6 → 39.6 | 0.10 | 0.975 | 47 KB |
| `stock-market.mp4` | 4,793,882 | 3,382,842 | `3807c473570f0d991df8274a91b032454fd8a8ba` | 25.4 → 25.5 | 28.1 → 28.1 | 25.4 → 25.6 | 0.21 | 0.972 | 46 KB |
| `strc-below-par.mp4` | 4,369,901 | 2,751,898 | `a116bf5344113c83fe12d48693410b1bb87eaf0b` | 23.6 → 23.7 | 23.6 → 23.7 | 24.0 → 24.1 | 0.14 | 0.971 | 50 KB |
| `synthesis.mp4` | 2,917,106 | 746,918 | `ef5db0fc249ee793f9e7450e3b83838477ca3a5c` | 9.1 → 9.0 | 9.6 → 9.6 | 11.3 → 11.3 | 0.07 | 0.992 | 11 KB |
| `the-bitcoin-floor.mp4` | 4,685,376 | 2,895,563 | `d6a0ce0ab09024c5644001392d3aac1be648e9c5` | 20.8 → 20.9 | 29.5 → 29.6 | 20.8 → 21.0 | 0.37 | 0.969 | 91 KB |
| `the-bitcoin-hurdle-rate.mp4` | 5,900,192 | 1,172,704 | `233ca9312c42311d9e2fbcf69e99b023242bb8e8` | 21.3 → 21.3 | 22.8 → 22.8 | 21.3 → 21.4 | 0.05 | 0.966 | 55 KB |
| `the-bitcoin-retirement-stress-test.mp4` | 6,559,730 | 1,384,680 | `ba186ef158e1f9571519f25ea15798eb068f5b31` | 25.0 → 25.0 | 25.0 → 25.1 | 25.0 → 25.0 | 0.06 | 0.972 | 28 KB |
| `the-doubling-ladder.mp4` | 5,379,693 | 3,201,258 | `113d37d0608f234cbab3dad85c3d900a92c575de` | 41.5 → 41.6 | 42.9 → 43.0 | 43.2 → 43.4 | 0.25 | 0.962 | 50 KB |
| `trilemma.mp4` | 2,777,729 | 262,503 | `20cbf4512343053f8c1790b4e07430e48b5dd69b` | 11.3 → 11.3 | 11.3 → 11.3 | 11.5 → 11.5 | 0.05 | 0.988 | 6 KB |
| `wait-or-deploy-now.mp4` | 4,789,558 | 1,300,339 | `f53421e4309ef5412d37be4328136d6605c1a8ca` | 35.9 → 35.9 | 36.0 → 36.0 | 42.6 → 42.6 | 0.13 | 0.983 | 17 KB |
| `what-bitcoin-is.mp4` | 2,357,185 | 577,082 | `6090612d266af08bff0ffbfef4f7ff3b59345e54` | 10.0 → 10.0 | 10.0 → 10.0 | 13.5 → 13.4 | 0.10 | 0.994 | 4 KB |
| `what-daily-conviction-bought.mp4` | 7,636,715 | 2,234,425 | `f1dfb66ca21c543105e4d45d96d51469a5d8d842` | 25.1 → 25.2 | 25.1 → 25.2 | 25.7 → 25.8 | 0.20 | 0.968 | 88 KB |
| `what-money-has-to-be.mp4` | 4,027,413 | 840,681 | `5f012e76ef17647eef9bc7f78a380d9a4ef368b7` | 28.4 → 28.4 | 28.4 → 28.4 | 31.0 → 31.2 | 0.21 | 0.980 | 44 KB |
| `what-money-is-for.mp4` | 6,311,669 | 1,031,013 | `ca2b2d29e2a245a4911069ea4705c6990a75d4ad` | 32.9 → 33.0 | 32.9 → 33.0 | 33.2 → 33.4 | 0.18 | 0.964 | 121 KB |
| `your-deployment-plan.mp4` | 8,776,085 | 1,822,224 | `b07ec4233aa1269e39cb87d359a3e3f44bcfc8a9` | 42.3 → 42.3 | 42.3 → 42.3 | 43.6 → 43.8 | 0.26 | 0.958 | 36 KB |
| **All 49** | **243,719,111** | **95,006,799** | | | | | | | **2245 KB** |

The as-landed sizes and SHA-1s recorded on the SITE_GUIDE §13 inventory rows describe the masters and are history from this date; this table is the custody record for the files in `videos/` now. To check a deployed clip, compare its SHA-1 with this table.
