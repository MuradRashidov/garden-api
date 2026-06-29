export type ReservationEmailData = {
  reservationId: string;
  confirmationCode?: string;
  status: string;
  createdAt: string;

  guestName: string;
  guestEmail: string;
  countryCode?: string;
  phoneNumber?: string;

  roomName: string;
  roomCount: number;

  checkIn: string;
  checkOut: string;
  nights: number;

  adults: number;
  children: number;
  babies: number;

  basePrice: number;
  extraFee: number;
  discount: number;
  totalPrice: number;
};

export function reservationCreatedTemplate(data: ReservationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Reservation Confirmation</title>
</head>

<body style="
margin:0;
padding:40px 0;
background:#eef2f7;
font-family:Arial,Helvetica,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="700"
style="
background:white;
border-radius:18px;
overflow:hidden;
box-shadow:0 10px 35px rgba(0,0,0,.08);
">

<!-- HEADER -->

<tr>
<td
style="
background:linear-gradient(135deg,#0d8f49,#1fbf72);
padding:45px;
text-align:center;
">
<h1
style="
margin:15px 0 5px;
color:white;
font-size:34px;
">
Gabala Garden Hotel
</h1>

<div
style="
color:white;
font-size:18px;
opacity:.9;
">
Reservation Confirmed
</div>

</td>
</tr>

<!-- BODY -->

<tr>
<td style="padding:40px;">

<h2 style="margin-top:0;">
Hello ${data.guestName},
</h2>

<p
style="
font-size:16px;
line-height:1.8;
color:#555;
">
Thank you for choosing
<b>Gabala Garden Hotel</b>.

Your reservation has been successfully confirmed.

We look forward to welcoming you.
</p>

<!-- Confirmation -->

<div
style="
background:#e8fff1;
border-left:6px solid #0d8f49;
padding:18px;
border-radius:10px;
margin:35px 0;
">

<div
style="
font-size:14px;
color:#777;
">
Confirmation Number
</div>

<div
style="
font-size:28px;
font-weight:bold;
color:#0d8f49;
letter-spacing:2px;
">
${data.confirmationCode ?? '-'}
</div>

</div>

<!-- DETAILS -->

<h3 style="margin-bottom:18px;">
Reservation Details
</h3>

<table
width="100%"
cellpadding="12"
style="
border-collapse:collapse;
background:#fafafa;
border-radius:12px;
overflow:hidden;
">

<tr>
<td><b>Reservation ID</b></td>
<td>${data.reservationId}</td>
</tr>

<tr>
<td><b>Status</b></td>
<td>${data.status}</td>
</tr>

<tr>
<td><b>Created</b></td>
<td>${data.createdAt}</td>
</tr>

<tr>
<td><b>Room</b></td>
<td>${data.roomName}</td>
</tr>

<tr>
<td><b>Rooms</b></td>
<td>${data.roomCount}</td>
</tr>

<tr>
<td><b>Check-In</b></td>
<td>${data.checkIn}</td>
</tr>

<tr>
<td><b>Check-Out</b></td>
<td>${data.checkOut}</td>
</tr>

<tr>
<td><b>Nights</b></td>
<td>${data.nights}</td>
</tr>

<tr>
<td><b>Adults</b></td>
<td>${data.adults}</td>
</tr>

<tr>
<td><b>Children</b></td>
<td>${data.children}</td>
</tr>

<tr>
<td><b>Babies</b></td>
<td>${data.babies}</td>
</tr>

<tr>
<td><b>Phone</b></td>
<td>${data.countryCode ?? ''} ${data.phoneNumber ?? '-'}</td>
</tr>

<tr>
<td><b>Email</b></td>
<td>${data.guestEmail}</td>
</tr>

</table>

<!-- PRICE -->

<div
style="
margin-top:35px;
background:#0d8f49;
color:white;
padding:30px;
border-radius:14px;
">

<h2
style="
margin-top:0;
text-align:center;
">
Price Summary
</h2>

<table width="100%" cellpadding="8">

<tr>
<td>Room Price</td>
<td align="right">${data.basePrice.toFixed(2)} ₼</td>
</tr>

<tr>
<td>Extra Fee</td>
<td align="right">${data.extraFee.toFixed(2)} ₼</td>
</tr>

<tr>
<td>Discount</td>
<td align="right">${data.discount}%</td>
</tr>

<tr>
<td colspan="2">
<hr style="border:none;border-top:1px solid rgba(255,255,255,.25)">
</td>
</tr>

<tr
style="
font-size:24px;
font-weight:bold;
">

<td>Total</td>

<td align="right">
${data.totalPrice.toFixed(2)} ₼
</td>

</tr>

</table>

</div>

<!-- FOOTER -->

<div
style="
margin-top:45px;
text-align:center;
color:#666;
line-height:1.8;
">

<h3 style="margin-bottom:8px;">
Gabala Garden Hotel
</h3>

📍 Gabala, Azerbaijan

<br>

☎ +994 10 724 11 11

<br>

✉ reservations@ggh.az
✉ gabalagardenapp.az@gmail.com

</div>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;
}
