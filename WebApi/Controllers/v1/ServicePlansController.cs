using Application.Catalog.Contracts;
using Application.Catalog.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
public class ServicePlansController : ControllerBase
{
    private readonly IServicePlanService _planService;

    public ServicePlansController(IServicePlanService planService)
    {
        _planService = planService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] ServicePlanQuery query)
    {
        var result = await _planService.GetPagedAsync(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _planService.GetByIdAsync(id);
        return Ok(result);
    }

    [Authorize(Policy = "ManageCatalog")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateServicePlanRequest request)
    {
        var result = await _planService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [Authorize(Policy = "ManageCatalog")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateServicePlanRequest request)
    {
        await _planService.UpdateAsync(id, request);
        return NoContent();
    }

    [Authorize(Policy = "ManageCatalog")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _planService.DeleteAsync(id);
        return NoContent();
    }

    // Prices endpoints
    [Authorize(Policy = "ManagePricing")]
    [HttpPost("{id}/prices")]
    public async Task<IActionResult> AddPrice(Guid id, [FromBody] CreatePlanPriceRequest request)
    {
        var result = await _planService.AddPriceAsync(id, request);
        return Ok(result);
    }

    [Authorize(Policy = "ManagePricing")]
    [HttpPut("prices/{priceId}")]
    public async Task<IActionResult> UpdatePrice(Guid priceId, [FromBody] UpdatePlanPriceRequest request)
    {
        await _planService.UpdatePriceAsync(priceId, request);
        return NoContent();
    }
    
    [Authorize(Policy = "ManagePricing")]
    [HttpPut("prices/{priceId}/effective-to")]
    [HttpPatch("prices/{priceId}/effective-to")]
    public async Task<IActionResult> UpdatePriceEffectiveTo(Guid priceId, [FromBody] DateTime? effectiveTo)
    {
        await _planService.UpdatePriceEffectiveToAsync(priceId, effectiveTo);
        return NoContent();
    }

    [Authorize(Policy = "ManagePricing")]
    [HttpDelete("prices/{priceId}")]
    public async Task<IActionResult> DeletePrice(Guid priceId)
    {
        await _planService.DeletePriceAsync(priceId);
        return NoContent();
    }
}
