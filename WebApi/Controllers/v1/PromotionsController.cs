using Application.Common.Interfaces;
using Application.Promotions.Contracts;
using Application.Promotions.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
public class PromotionsController : ControllerBase
{
    private readonly IPromotionService _promotionService;
    private readonly IQrCodeGenerator _qrCodeGenerator;

    public PromotionsController(IPromotionService promotionService, IQrCodeGenerator qrCodeGenerator)
    {
        _promotionService = promotionService;
        _qrCodeGenerator = qrCodeGenerator;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] PromotionQuery query)
    {
        var result = await _promotionService.GetPagedAsync(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _promotionService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpGet("code/{code}")]
    public async Task<IActionResult> GetByCode(string code)
    {
        var result = await _promotionService.GetByCodeAsync(code);
        return Ok(result);
    }

    [Authorize(Policy = "ManagePromotions")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePromotionRequest request)
    {
        var result = await _promotionService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [Authorize(Policy = "ManagePromotions")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePromotionRequest request)
    {
        await _promotionService.UpdateAsync(id, request);
        return NoContent();
    }

    [Authorize(Policy = "ManagePromotions")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _promotionService.DeleteAsync(id);
        return NoContent();
    }

    [Authorize(Policy = "ManageQrCodes")]
    [HttpGet("{id}/qr-code")]
    public async Task<IActionResult> GenerateQrCode(Guid id)
    {
        var promotion = await _promotionService.GetByIdAsync(id);
        
        // Example URL format that frontend might use to apply promotion
        var url = $"https://cloudservicestore.com/apply-promo?code={promotion.Code}";
        
        var qrCodeBytes = _qrCodeGenerator.GenerateQrCode(url);
        
        return Ok(new {
            PromotionId = promotion.Id,
            Code = promotion.Code,
            QrCodeBase64 = Convert.ToBase64String(qrCodeBytes)
        });
    }

    [Authorize(Policy = "ManageQrCodes")]
    [HttpGet("{id}/qr-code/image")]
    public async Task<IActionResult> GetQrCodeImage(Guid id)
    {
        var promotion = await _promotionService.GetByIdAsync(id);
        var url = $"https://cloudservicestore.com/apply-promo?code={promotion.Code}";
        var qrCodeBytes = _qrCodeGenerator.GenerateQrCode(url);
        
        return File(qrCodeBytes, "image/png");
    }
}
