// Dữ liệu tham chiếu TĨNH của Trình dựng Product Pattern — trích NGUYÊN từ prototype
// (BLOCKS(), OTS(), OT_BLOCK_MATRIX, COVER_COLS, ATTR_NAMES).
// Đây là catalog mô tả block/answer-slot/attribute (giống bộ icon/nav) — không phải số cứng của
// một pattern cụ thể. Cấu trúc block & obligation type của từng pattern LẤY TỪ API (data thật);
// file này chỉ cung cấp tên/slot/nhóm nghiệp vụ/ma trận để hiển thị pixel-perfect.

export interface Slot {
  name: string
  code: string
  type: string
  req: boolean
  def: string
  rule: string
}
export interface BlockDef {
  id: string
  name: string
  code: string
  group: string
  gov: string
  slots: Slot[]
}

export const BLOCK_LIB: BlockDef[] = [
  { id: 'BLK_ELIGIBILITY', name: 'Điều kiện tham gia', code: 'BLOCK_ELIGIBILITY', group: 'Khởi tạo', gov: 'Eligibility', slots: [
    { name: 'Độ tuổi', code: 'age', type: 'Range', req: true, def: '18 – 60', rule: 'MIN 18' },
    { name: 'Nghề nghiệp', code: 'occupation', type: 'Enum', req: false, def: '—', rule: '—' },
    { name: 'Thu nhập tối thiểu', code: 'min_income', type: 'Money', req: true, def: '5.000.000đ', rule: '≥ 0' },
  ] },
  { id: 'BLK_COUNTERPARTY', name: 'Bên tham gia', code: 'BLOCK_COUNTERPARTY', group: 'Khởi tạo', gov: 'Obligor Party', slots: [
    { name: 'Lender Party', code: 'lender_party', type: 'Ref', req: true, def: 'F88', rule: 'is_identify' },
    { name: 'Borrower Party Type', code: 'borrower_type', type: 'Enum', req: true, def: 'Cá nhân', rule: '—' },
    { name: 'Beneficiary Party', code: 'beneficiary', type: 'Ref', req: false, def: '—', rule: '—' },
  ] },
  { id: 'BLK_REGULATORY', name: 'Tuân thủ & Pháp lý', code: 'BLOCK_REGULATORY', group: 'Khởi tạo', gov: 'Legal Form', slots: [
    { name: 'Legal Form', code: 'legal_form', type: 'Enum', req: true, def: 'Giấy nhận nợ', rule: '—' },
    { name: 'Compliance Flag', code: 'compliance', type: 'Bool', req: true, def: 'Bật', rule: 'by-default' },
  ] },
  { id: 'BLK_LIMIT', name: 'Hạn mức (Limit)', code: 'BLOCK_LIMIT', group: 'Giá trị', gov: 'FACILITY_OBLIGATION', slots: [
    { name: 'Hạn mức cấp', code: 'limit_amount', type: 'Money', req: true, def: '3tr – 2 tỷ', rule: 'range' },
    { name: 'Số dư tối thiểu', code: 'min_amount', type: 'Money', req: false, def: '0đ', rule: '—' },
    { name: 'Capacity Range', code: 'capacity_range', type: 'Range', req: true, def: 'Có quản trị', rule: 'HAS_CAPACITY' },
  ] },
  { id: 'BLK_VALUEBASE', name: 'Cơ sở giá trị (Value Base)', code: 'BLOCK_VALUE_BASE', group: 'Giá trị', gov: 'PRINCIPAL_NO_INCREASE', slots: [
    { name: 'Decrease Method', code: 'decrease_method', type: 'Enum', req: true, def: 'Giảm dần theo gốc', rule: 'MULTI_DECREASE' },
    { name: 'Principal Base', code: 'principal_base', type: 'Enum', req: true, def: 'Gốc vay', rule: 'NO_INCREASE' },
  ] },
  { id: 'BLK_DISBURSEMENT', name: 'Giải ngân (Disbursement)', code: 'BLOCK_DISBURSEMENT', group: 'Kích hoạt', gov: 'EVENT_LENDER_DISBURSEMENT', slots: [
    { name: 'Disbursement Method', code: 'disb_method', type: 'Enum', req: true, def: 'Chuyển khoản', rule: '—' },
    { name: 'Disbursement Syntax', code: 'disb_syntax', type: 'Text', req: false, def: 'F88 {contract}', rule: '—' },
    { name: 'Money Transfer Content', code: 'transfer_content', type: 'Text', req: false, def: '—', rule: '—' },
  ] },
  { id: 'BLK_INTEREST', name: 'Lãi suất (Interest)', code: 'BLOCK_INTEREST', group: 'Vận hành', gov: 'TERM_LOAN_OBLIGATION', slots: [
    { name: 'Interest Calculation', code: 'interest_calc', type: 'Formula', req: true, def: 'Dư nợ giảm dần', rule: '—' },
    { name: 'Base Rate', code: 'base_rate', type: 'Percent', req: true, def: '1,5%/tháng', rule: '≤ trần NHNN' },
    { name: 'Rate Type', code: 'rate_type', type: 'Enum', req: true, def: 'Cố định', rule: '—' },
  ] },
  { id: 'BLK_FEE', name: 'Phí (Fee)', code: 'BLOCK_FEE', group: 'Vận hành', gov: 'TERM_LOAN_OBLIGATION', slots: [
    { name: 'Fee Type', code: 'fee_type', type: 'Enum', req: true, def: 'Phí thẩm định', rule: '—' },
    { name: 'Fee Amount', code: 'fee_amount', type: 'Money', req: false, def: '—', rule: '—' },
  ] },
  { id: 'BLK_REPAYMENT', name: 'Trả nợ (Repayment)', code: 'BLOCK_REPAYMENT', group: 'Vận hành', gov: 'PAYMENT_MULTISTEP', slots: [
    { name: 'Repayment Method', code: 'repay_method', type: 'Enum', req: true, def: 'Trả góp nhiều kỳ', rule: 'MULTISTEP' },
    { name: 'Số kỳ', code: 'installment_count', type: 'Int', req: true, def: '1 – 18', rule: '—' },
    { name: 'Lịch trả', code: 'schedule', type: 'Enum', req: true, def: 'Hàng tháng', rule: 'HAS_CYCLE' },
  ] },
  { id: 'BLK_COLLATERAL', name: 'Tài sản đảm bảo', code: 'BLOCK_COLLATERAL', group: 'Thu hồi', gov: 'ASSET_PLEDGE', slots: [
    { name: 'Asset Type', code: 'asset_type', type: 'Enum', req: true, def: 'Xe máy', rule: 'ASSET_PLEDGE' },
    { name: 'Asset Valuation Formula', code: 'asset_valuation', type: 'Formula', req: true, def: '70% giá trị', rule: 'LTV ≤ 80%' },
    { name: 'LTV tối đa', code: 'ltv', type: 'Percent', req: true, def: '80%', rule: '≤ 80%' },
  ] },
  { id: 'BLK_PENALTY', name: 'Phạt & Quá hạn', code: 'BLOCK_PENALTY', group: 'Thu hồi', gov: 'PENALTY', slots: [
    { name: 'Penalty Rate', code: 'penalty_rate', type: 'Percent', req: true, def: '150% lãi', rule: '≤ 150%' },
    { name: 'Grace Period', code: 'grace', type: 'Int', req: false, def: '5 ngày', rule: '—' },
  ] },
  { id: 'BLK_BILLING', name: 'Sao kê & Hóa đơn', code: 'BLOCK_BILLING', group: 'Vận hành', gov: 'CALENDAR_HAS_CYCLE', slots: [
    { name: 'Statement Cycle', code: 'stmt_cycle', type: 'Enum', req: false, def: 'Hàng tháng', rule: '—' },
    { name: 'Billing Day', code: 'billing_day', type: 'Int', req: false, def: 'Ngày 5', rule: '1–28' },
  ] },
]

export const BLOCK_BY_ID: Record<string, BlockDef> = Object.fromEntries(BLOCK_LIB.map((b) => [b.id, b]))

// Archetype hiển thị theo obligation type code (từ OTS() prototype).
export const OT_ARCHETYPE: Record<string, string> = {
  OT_PLEDGE_INSTALLMENT: 'Term Loan',
  OT_PLEDGE_BULLET: 'Term Loan',
  OT_FACILITY: 'Revolving',
  OT_UNSECURED: 'Term Loan',
  OT_AUTO_PLEDGE: 'Term Loan',
}

// Ma trận Obligation Type × Block (req | pos | no) — cột theo COVER_COLS.
// OT_AUTO_PLEDGE bổ sung (mirror PLEDGE_INSTALLMENT) để pattern cầm cố ô tô có độ phủ hợp lý.
export const OT_BLOCK_MATRIX: Record<string, string[]> = {
  OT_PLEDGE_INSTALLMENT: ['req', 'req', 'req', 'req', 'no', 'pos'],
  OT_PLEDGE_BULLET: ['req', 'req', 'req', 'no', 'no', 'pos'],
  OT_FACILITY: ['req', 'req', 'pos', 'req', 'req', 'pos'],
  OT_UNSECURED: ['req', 'req', 'no', 'req', 'no', 'req'],
  OT_AUTO_PLEDGE: ['req', 'req', 'req', 'req', 'no', 'pos'],
}

export const COVER_COLS = [
  { key: 'counterparty', label: 'Bên tham gia', blockId: 'BLK_COUNTERPARTY' },
  { key: 'interest', label: 'Lãi suất', blockId: 'BLK_INTEREST' },
  { key: 'collateral', label: 'Tài sản đảm bảo', blockId: 'BLK_COLLATERAL' },
  { key: 'repayment', label: 'Trả nợ', blockId: 'BLK_REPAYMENT' },
  { key: 'limit', label: 'Hạn mức', blockId: 'BLK_LIMIT' },
  { key: 'penalty', label: 'Phạt & Quá hạn', blockId: 'BLK_PENALTY' },
]

export const ATTR_NAMES: Record<string, string> = {
  base_rate: 'Lãi suất cơ sở', limit_amount: 'Hạn mức cấp', ltv: 'Tỷ lệ cho vay (LTV)',
  installment_count: 'Số kỳ trả góp', asset_type: 'Loại tài sản', penalty_rate: 'Lãi suất phạt',
  borrower_type: 'Loại bên vay', repay_method: 'Phương thức trả nợ', interest_calc: 'Công thức tính lãi',
  rate_type: 'Loại lãi suất', asset_valuation: 'Công thức định giá TS', lender_party: 'Bên cho vay',
  beneficiary: 'Bên thụ hưởng', legal_form: 'Hình thức pháp lý', compliance: 'Cờ tuân thủ',
  min_amount: 'Số dư tối thiểu', capacity_range: 'Khoảng capacity', decrease_method: 'Phương thức giảm gốc',
  principal_base: 'Cơ sở gốc', disb_method: 'Phương thức giải ngân', disb_syntax: 'Cú pháp giải ngân',
  transfer_content: 'Nội dung chuyển tiền', age: 'Độ tuổi', occupation: 'Nghề nghiệp',
  min_income: 'Thu nhập tối thiểu', fee_type: 'Loại phí', fee_amount: 'Số tiền phí',
  schedule: 'Lịch trả nợ', grace: 'Thời gian ân hạn', stmt_cycle: 'Chu kỳ sao kê', billing_day: 'Ngày chốt sao kê',
}

export function attrLabel(code: string): string {
  return (ATTR_NAMES[code] || code) + ' · ' + code
}
