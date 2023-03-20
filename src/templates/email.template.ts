export const sendWelcomeEmail= (
	fullName: string,
	email: string,
  ID: string,
  password: string
) => {
	return `<!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Email Confirmation</title>
        <style>
            /* -------------------------------------
        GLOBAL RESETS
    ------------------------------------- */
    
    img {
        border: none;
        -ms-interpolation-mode: bicubic;
        max-width: 100%; 
      }
      
      body {
        background-color: white;
        font-family: 'Montserrat' sans-serif;
        -webkit-font-smoothing: antialiased;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.4;
        margin: 0;
        padding: 0;
        -ms-text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%; 
      }
      
      table {
        border-collapse: separate;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        min-width: 100%;
        width: 100%; }
        table td {
          font-family: sans-serif;
          font-size: 14px;
          vertical-align: top; 
      }
      
      /* -------------------------------------
          BODY & CONTAINER
      ------------------------------------- */
      
      .body {
        background-color: white;
        width: 100%; 
      }
      
      /* Max-width will also shrink down on a phone */
      .container {
        display: block;
        Margin: 0 auto !important;
        max-width: 580px;
        padding: 40px;
        width: 580px; 
      }
      
      .content {
        box-sizing: border-box;
        display: block;
        Margin: 0 auto;
        max-width: 580px;
        border: 1px solid #EEEEEE;
      }
      
      /* -------------------------------------
          HEADER, FOOTER, MAIN
      ------------------------------------- */
      .main {
        background: #ffffff;
        border-radius: 3px;
        width: 100%; 
      }
      
      .header {
        padding: 20px 0;
        background-color: #6A66F2;
      }
      
      .wrapper {
        box-sizing: border-box;
        padding: 20px; 
      }
      
      .content-block {
        padding-bottom: 10px;
        padding-top: 10px;
      }
      
      .footer {
        clear: both;
        Margin-top: 10px;
        text-align: center;
        width: 100%; 
      }
        .footer td,
        .footer p,
        .footer span,
        .footer a {
          font-size: 12px;
          text-align: center; 
      }
      
      /* -------------------------------------
          TYPOGRAPHY
      ------------------------------------- */
      h1,
      h2,
      h3,
      h4 {
        color: #06090f;
        font-family: sans-serif;
        font-weight: 400;
        line-height: 1.4;
        margin: 0;
        margin-bottom: 30px; 
      }
      
      h1 {
        font-size: 35px;
        font-weight: 300;
        text-align: center;
        text-transform: capitalize; 
      }
      
      p,
      ul,
      ol {
        font-family: sans-serif;
        font-size: 14px;
        font-weight: normal;
        margin: 0;
        margin-bottom: 15px; 
      }
        p li,
        ul li,
        ol li {
          list-style-position: inside;
          margin-left: 5px; 
      }
      
      a {
        color: #6A66F2;
        text-decoration: underline; 
      }
      
      /* -------------------------------------
          BUTTONS
      ------------------------------------- */
      .btn {
        box-sizing: border-box;
        width: 100%; }
        .btn > tbody > tr > td {
          padding-bottom: 15px; }
        .btn table {
          padding-top: 10px;
          padding-bottom: 10px;
          min-width: 100%;
          width: 100%; 
      }
        .btn table td {
          background-color: #ffffff;
          border-radius: 5px;
          text-align: center; 
      }
        .btn a {
          background-color: #ffffff;
          border: solid 1px green;
          border-radius: 5px;
          box-sizing: border-box;
          color: green;
          cursor: pointer;
          display: inline-block;
          font-size: 14px;
          font-weight: 700;
          margin: 0;
          padding: 12px 25px;
          text-decoration: none;
          text-transform: capitalize; 
      }
      
      .btn-primary table td {
        background-color: #39B85D; 
      }
      
      .btn-primary a {
        background-color: #39B85D;
        border-color: #39B85D;
        color: #ffffff; 
      }
      
      /* -------------------------------------
          OTHER STYLES THAT MIGHT BE USEFUL
      ------------------------------------- */
      .last {
        margin-bottom: 0; 
      }
      
      .first {
        margin-top: 0; 
      }
      
      .align-center {
        text-align: center; 
      }
      
      .align-right {
        text-align: right; 
      }
      
      .align-left {
        text-align: left; 
      }
      
      .clear {
        clear: both; 
      }
      
      .mt0 {
        margin-top: 0; 
      }
      
      .mb0 {
        margin-bottom: 0; 
      }
      
      .preheader {
        color: transparent;
        display: none;
        height: 0;
        max-height: 0;
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        mso-hide: all;
        visibility: hidden;
        width: 0; 
      }
      
      
      hr {
        border: 0;
        border-bottom: 1px solid #f6f6f6;
        Margin: 20px 0; 
      }
      
      /* -------------------------------------
          RESPONSIVE AND MOBILE FRIENDLY STYLES
      ------------------------------------- */
      @media only screen and (max-width: 620px) {
        table[class=body] h1 {
          font-size: 28px !important;
          margin-bottom: 10px !important; 
        }
        table[class=body] p,
        table[class=body] ul,
        table[class=body] ol,
        table[class=body] td,
        table[class=body] span,
        table[class=body] a {
          font-size: 16px !important; 
        }
        table[class=body] .wrapper,
        table[class=body] .article {
          padding: 10px !important; 
        }
        table[class=body] .content {
          padding: 0 !important; 
        }
        table[class=body] .container {
          padding: 0 !important;
          width: 100% !important; 
        }
        table[class=body] .main {
          border-left-width: 0 !important;
          border-radius: 0 !important;
          border-right-width: 0 !important; 
        }
        table[class=body] .btn table {
          width: 100% !important; 
        }
        table[class=body] .btn a {
          width: 100% !important; 
        }
        table[class=body] .img-responsive {
          height: auto !important;
          max-width: 100% !important;
          width: auto !important; 
        }
      }
      
      /* -------------------------------------
          PRESERVE THESE STYLES IN THE HEAD
      ------------------------------------- */
      @media all {
        .ExternalClass {
          width: 100%; 
        }
        .ExternalClass,
        .ExternalClass p,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
          line-height: 100%; 
        }
        .apple-link a {
          /* color: inherit !important; */
          font-family: inherit !important;
          font-size: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
          text-decoration: none !important; 
        }
        .btn-primary table td:hover {
          background-color: #39B85D !important; 
        }
        .btn-primary a:hover {
          background-color: #39B85D !important;
          border-color: #39B85D !important; 
        } 
      }
        </style>
      </head>
      <body class="">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
          <tr>
            <td>&nbsp;</td>
            <td class="container">
              <div class="header">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="align-center" width="100%">
                      <a href="https://paisr.tech"><img src="https://uploads-ssl.webflow.com/6229452c6a37c3f03c65fe84/624b1910d0c62b6ee77b5df1_PAISR%20Logo%20-%20Secondary.png" height="40" alt="Paisr Logo"></a>
                    </td>
                  </tr>
                </table>
              </div>
              <div class="content">
    
                <!-- START CENTERED WHITE CONTAINER -->
                <span class="preheader">This is preheader text. Some clients will show this text as a preview.</span>
                <table role="presentation" class="main">
    
                  <!-- START MAIN CONTENT AREA -->
                  <tr>
                    <td class="wrapper">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <p><b>Hello ${fullName},</b></p>
                            <p>Thank you for joining our organization <b>Heckerbella</b>! We're happy you decided to join us in making healthcare accessible to all.</p>
                            <p>Your login details are as follows. You have to change password to your desired password on first log in.</p>
                            <br>
                            <p>Email: ${email}</p>
                            <p>staffId: ${ID}</p>
                            <p>Password: ${password}</p>
                            
                            <p>If you experience any issues confirming your account, reach out to us at <a href="mailto:support@heckerbella.com." style="text-decoration: none;">support@heckerbella.com</a></p><br>
                            <p>Best, <br><b>The HMS team.</b> 🙎🏿‍♂️👨🏾‍💻</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
    
                <!-- END MAIN CONTENT AREA -->
                </table>
    
              <!-- END CENTERED WHITE CONTAINER -->
              </div>
              <!-- START FOOTER -->
              <div class="footer">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="content-block">
                      <span class="apple-link">This is an automatically generated email sent to, please do not reply. If you need help contacting us, please send us an email at <a href="mailto:support@heckerbella.com">support@heckerbella.com</a> and we'll get back to you.</span>
                    </td>
                  </tr>
                  <tr>
                    <td class="content-block">
                      <b>Copyright © 2019 - 2022 Heckerbella, Lagos.</b> <br> All rights reserved.
                    </td>
                  </tr>
                </table>
              </div>
              <!-- END FOOTER -->
            </td>
          </tr>
        </table>
      </body>
    </html>`;
};

/*
// <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
                            //   <tbody>
                            //     <tr>
                            //       <td align="center">
                            //         <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            //           <tbody>
                            //             <tr>
                            //               <td> <a href="#" target="_blank">Email: ${email} </a> </td>
                            //               <td> <a href="#" target="_blank">staffId: ${ID} </a> </td>
                            //               <td> <a href="#" target="_blank">Password: ${password} </a> </td>
                            //             </tr>
                            //           </tbody>
                            //         </table>
                            //       </td>
                            //     </tr>
                            //   </tbody>
                            // </table>
*/