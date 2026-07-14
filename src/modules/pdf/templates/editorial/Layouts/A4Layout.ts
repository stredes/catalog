import { editorialColors } from '../Colors';
import { editorialGrid } from '../Grid';
import { editorialTypography } from '../Typography';

export function renderEditorialStyles() {
  return `<style>
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${editorialColors.paper};color:${editorialColors.ink};font-family:${editorialTypography.family};font-size:${editorialTypography.body}px;line-height:1.48}
.page-break{break-after:page;page-break-after:always;height:0}
.editorial-page{background:${editorialColors.paper};display:flex;flex-direction:column;height:${editorialGrid.pageHeightMm}mm;overflow:hidden;padding:${editorialGrid.marginMm}mm;position:relative;width:${editorialGrid.pageWidthMm}mm}
.editorial-page main{flex:1;min-height:0}
.running-header,.running-footer{align-items:center;color:${editorialColors.muted};display:flex;font-size:${editorialTypography.footer}px;justify-content:space-between;letter-spacing:.8px;text-transform:uppercase}
.running-header{border-bottom:1px solid ${editorialColors.divider};height:9mm;margin-bottom:7mm;padding-bottom:3mm}
.running-footer{border-top:1px solid ${editorialColors.divider};height:9mm;margin-top:7mm;padding-top:3mm}
.placeholder-media{align-items:center;background:${editorialColors.paperSoft};border:1px solid ${editorialColors.divider};color:${editorialColors.muted};display:flex;font-size:8px;justify-content:center;letter-spacing:.5px;text-transform:uppercase}
.image-cover img{height:100%;object-fit:cover;width:100%}.image-contain img{height:100%;object-fit:contain;width:100%}
.chapter-label{color:${editorialColors.muted};font-size:7px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase}
.chapter-title{font-size:${editorialTypography.chapter}px;font-weight:800;letter-spacing:0;line-height:1.02;text-transform:uppercase}
.body-copy{color:${editorialColors.inkSoft};font-size:${editorialTypography.body}px;line-height:1.55}
.divider{background:${editorialColors.divider};height:1px;width:100%}
.dark{background:${editorialColors.ink};color:${editorialColors.paper}}
.quote{border-left:2px solid currentColor;font-size:13px;font-weight:700;line-height:1.25;padding-left:5mm;text-transform:uppercase}
.cover-page{padding:0}
.cover-wrap{display:flex;height:100%;width:100%}
.cover-left{display:flex;flex-direction:column;justify-content:space-between;padding:16mm;width:45%}
.cover-right{background:${editorialColors.ink};color:${editorialColors.paper};display:flex;flex-direction:column;justify-content:space-between;padding:18mm;width:55%}
.brand-lockup{font-size:10px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase}
.cover-photo{height:126mm;margin:11mm 0;overflow:hidden;width:100%}
.cover-contact{border-top:1px solid ${editorialColors.divider};display:flex;flex-direction:column;gap:2mm;padding-top:5mm}
.cover-contact span{color:${editorialColors.muted};font-size:8px}
.cover-kicker{font-size:8px;font-weight:800;letter-spacing:2px;text-transform:uppercase}
.cover-title{font-size:${editorialTypography.cover}px;font-weight:900;line-height:.96;text-transform:uppercase}
.cover-subtitle{font-size:${editorialTypography.subtitle}px;font-weight:700;line-height:1.2;max-width:82mm}
.cover-circle{align-items:center;align-self:flex-end;border-radius:50%;height:48mm;justify-content:center;margin-top:8mm;overflow:hidden;width:48mm}
.cover-season{align-items:flex-end;display:flex;justify-content:space-between}
.cover-season strong{font-size:20px}.cover-season span{font-size:8px;letter-spacing:1.4px;text-transform:uppercase}
.welcome-layout{display:flex;gap:10mm;height:100%}
.welcome-left{display:flex;flex-direction:column;justify-content:space-between;width:48%}
.welcome-image{height:118mm;overflow:hidden}
.welcome-right{display:flex;flex-direction:column;justify-content:space-between;width:52%}
.toc-list{border-top:1px solid ${editorialColors.ink};margin-top:9mm}
.toc-row{align-items:center;border-bottom:1px solid ${editorialColors.divider};display:flex;min-height:14mm}
.toc-row strong{font-size:8px;width:18mm}.toc-row span{font-size:13px;font-weight:800;text-transform:uppercase;width:1px;flex:1}.toc-row em{color:${editorialColors.muted};font-style:normal;text-align:right;width:12mm}
.about-layout{display:flex;gap:9mm;height:100%}
.about-dark{display:flex;flex-direction:column;justify-content:space-between;padding:11mm;width:42%}
.about-main{display:flex;flex-direction:column;gap:7mm;width:58%}
.about-image{height:86mm;overflow:hidden}.values{display:flex;flex-wrap:wrap;gap:3mm}.value-pill{border:1px solid ${editorialColors.divider};font-size:8px;font-weight:800;padding:2mm 3mm;text-transform:uppercase}
.category-open{display:flex;height:100%;gap:9mm}.category-open.reverse{flex-direction:row-reverse}.category-photo{height:100%;overflow:hidden;width:56%}.category-copy{display:flex;flex-direction:column;justify-content:space-between;width:44%}.category-number{font-size:58px;font-weight:900;line-height:.9}.category-count{border-top:1px solid ${editorialColors.ink};font-size:8px;font-weight:800;letter-spacing:1.1px;padding-top:4mm;text-transform:uppercase}
.products-dark{background:${editorialColors.ink};color:${editorialColors.paper};padding:14mm}
.products-dark .running-header,.products-dark .running-footer{border-color:#3a3a3a;color:${editorialColors.neutral}}
.product-six{display:flex;flex-wrap:wrap;gap:5mm;height:100%;align-content:flex-start}.product-six-card{break-inside:avoid;width:calc((100% - 10mm)/3)}.product-six-media{background:#2a2a2a;height:39mm;margin-bottom:4mm;overflow:hidden}.product-name{font-size:${editorialTypography.product}px;font-weight:900;line-height:1.15;text-transform:uppercase}.product-meta-line{color:${editorialColors.muted};font-size:7px;font-weight:700;letter-spacing:.8px;margin-top:1mm;text-transform:uppercase}.product-price{font-size:12px;font-weight:900;margin-top:2mm}
.product-four{display:flex;flex-wrap:wrap;gap:7mm;height:100%;align-content:flex-start}.product-four-card{border-top:4mm solid ${editorialColors.ink};break-inside:avoid;display:flex;gap:4mm;min-height:56mm;padding-top:4mm;width:calc((100% - 7mm)/2)}.product-four-media{height:43mm;overflow:hidden;width:43mm}.product-four-copy{display:flex;flex-direction:column;justify-content:space-between;flex:1}
.product-feature-layout{display:flex;gap:10mm;height:100%}.feature-card{display:flex;flex-direction:column;justify-content:space-between;width:50%}.feature-media{height:112mm;overflow:hidden}.feature-copy{border-top:1px solid ${editorialColors.ink};padding-top:5mm}.feature-copy h3{font-size:22px;font-weight:900;line-height:1.04;text-transform:uppercase}.feature-copy p{font-size:9px;margin-top:3mm}
.premium-product{display:flex;gap:10mm;height:100%}.premium-media{height:100%;overflow:hidden;width:58%}.premium-copy{display:flex;flex-direction:column;justify-content:flex-end;width:42%}.premium-copy h2{font-size:34px;font-weight:900;line-height:.98;text-transform:uppercase}.spec-list{border-top:1px solid ${editorialColors.ink};display:flex;flex-direction:column;margin-top:7mm}.spec-row{border-bottom:1px solid ${editorialColors.divider};display:flex;font-size:8px;justify-content:space-between;padding:2.5mm 0}.spec-row strong{text-align:right}
.gallery-layout{display:flex;gap:5mm;height:100%}.gallery-dominant{height:100%;overflow:hidden;width:62%}.gallery-stack{display:flex;flex-direction:column;gap:5mm;width:38%}.gallery-small{flex:1;overflow:hidden}.gallery-caption{border-top:1px solid ${editorialColors.ink};font-size:8px;font-weight:800;letter-spacing:1px;padding-top:4mm;text-transform:uppercase}
.comparison-list{display:flex;flex-direction:column;gap:4mm}.comparison-item{align-items:center;border-top:1px solid ${editorialColors.divider};display:flex;gap:5mm;padding-top:4mm}.comparison-thumb{height:26mm;overflow:hidden;width:26mm}.comparison-copy{flex:1}.comparison-price{font-size:14px;font-weight:900;text-align:right;width:28mm}
.contact-layout{display:flex;height:100%}.contact-dark{display:flex;flex-direction:column;justify-content:space-between;padding:12mm;width:50%}.contact-light{display:flex;flex-direction:column;justify-content:space-between;padding:12mm;width:50%}.contact-list{border-top:1px solid currentColor;display:flex;flex-direction:column;gap:3mm;padding-top:6mm}.contact-list p{font-size:10px}.qr-box{align-items:center;align-self:flex-end;border:1px solid currentColor;display:flex;font-size:8px;font-weight:900;height:42mm;justify-content:center;letter-spacing:1px;text-transform:uppercase;width:42mm}
</style>`;
}
